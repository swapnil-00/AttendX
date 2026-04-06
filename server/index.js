require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { URL } = require('url');
const dns = require('dns');
const rateLimit = require('express-rate-limit');

// Use Google public DNS — local DNS server refuses to resolve neon.tech
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const app = express();

// Environment-based CORS configuration
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : process.env.NODE_ENV === 'production'
  ? ['https://your-app.vercel.app'] // Update this with your Vercel domain
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({ 
  origin: corsOrigins,
  credentials: true 
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── DB connection ────────────────────────────────────────────────────────────
// dns.resolve4() uses Node's built-in resolver (respects dns.setServers),
// unlike pg's getaddrinfo which calls the OS. So we resolve the IP ourselves
// and pass it directly — SNI (servername) preserves correct TLS handshake.
const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, '');
const dbUrl = new URL(cleanUrl);

let pool;

async function createPool() {
  const addresses = await new Promise((resolve, reject) => {
    dns.resolve4(dbUrl.hostname, (err, addrs) => {
      if (err) reject(err);
      else resolve(addrs);
    });
  });
  console.log(`🔍 Resolved ${dbUrl.hostname} → ${addresses[0]}`);
  return new Pool({
    host:     addresses[0],
    port:     parseInt(dbUrl.port) || 5432,
    database: dbUrl.pathname.replace(/^\//, ''),
    user:     decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    ssl: {
      rejectUnauthorized: false,
      servername: dbUrl.hostname, // SNI — must match the TLS certificate
    },
    // Connection pool configuration
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
  });
}

// ─── DB Init ─────────────────────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS persons (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      person_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status CHAR(1) CHECK (status IN ('P', 'A')),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(person_id, date)
    )
  `);

  // Seed 10 sample people only if DB is empty
  const { rows } = await pool.query('SELECT COUNT(*) FROM persons');
  if (parseInt(rows[0].count) === 0) {
    console.log('Seeding sample data...');
    
    // Batch insert persons
    const personValues = Array.from({ length: 10 }, (_, i) => `('Person ${i + 1}')`).join(',');
    await pool.query(`INSERT INTO persons (name) VALUES ${personValues} ON CONFLICT (name) DO NOTHING`);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const persons = await pool.query('SELECT id FROM persons ORDER BY id ASC');

    // Batch insert attendance records
    const attendanceValues = [];
    for (const person of persons.rows) {
      for (let day = 1; day <= today; day++) {
        const status = Math.random() > 0.25 ? 'P' : 'A';
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        attendanceValues.push(`(${person.id}, '${dateStr}', '${status}')`);
      }
    }
    
    if (attendanceValues.length > 0) {
      // Insert in chunks of 100 to avoid query size limits
      const chunkSize = 100;
      for (let i = 0; i < attendanceValues.length; i += chunkSize) {
        const chunk = attendanceValues.slice(i, i + chunkSize);
        await pool.query(
          `INSERT INTO attendance (person_id, date, status) VALUES ${chunk.join(',')}
           ON CONFLICT (person_id, date) DO NOTHING`
        );
      }
    }
    console.log('Seeding complete.');
  }
}

// ─── Persons ─────────────────────────────────────────────────────────────────
app.get('/api/persons', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM persons ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/persons', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    
    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length > 255) {
      return res.status(400).json({ error: 'Name must be 255 characters or less' });
    }
    
    // Basic XSS prevention - reject names with HTML tags
    if (/<[^>]*>/g.test(trimmedName)) {
      return res.status(400).json({ error: 'Name contains invalid characters' });
    }
    
    const { rows } = await pool.query(
      'INSERT INTO persons (name) VALUES ($1) RETURNING *',
      [trimmedName]
    );
    res.json(rows[0]);
  } catch (err) {
    // Fix #12 — Duplicate name: return a friendly 409 instead of raw PG error
    if (err.code === '23505') {
      return res.status(409).json({ error: `"${req.body.name.trim()}" already exists in the register.` });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/persons/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid person ID' });
    await pool.query('DELETE FROM persons WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Attendance ───────────────────────────────────────────────────────────────
app.get('/api/attendance', async (req, res) => {
  try {
    const { month } = req.query; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month query param must be YYYY-MM' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM attendance WHERE TO_CHAR(date, 'YYYY-MM') = $1`,
      [month]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/attendance', async (req, res) => {
  try {
    const { person_id, date, status } = req.body;

    // Fix #9 — Input validation
    if (!person_id || isNaN(parseInt(person_id))) {
      return res.status(400).json({ error: 'person_id must be a valid number' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }
    if (status !== 'P' && status !== 'A') {
      return res.status(400).json({ error: 'status must be P or A' });
    }

    const { rows } = await pool.query(
      `INSERT INTO attendance (person_id, date, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (person_id, date) DO UPDATE SET status = EXCLUDED.status
       RETURNING *`,
      [parseInt(person_id), date, status]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

let server;

// For Vercel serverless, export the app
if (process.env.VERCEL) {
  createPool()
    .then(p => {
      pool = p;
      return initDB();
    })
    .then(() => {
      console.log('✅ Database initialized for Vercel');
    })
    .catch(err => {
      console.error('❌ Startup failed:', err.message);
    });
  
  module.exports = app;
} else {
  // For local development
  createPool()
    .then(p => {
      pool = p;
      return initDB();
    })
    .then(() => {
      server = app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
    })
    .catch(err => {
      console.error('❌ Startup failed:', err.message);
      process.exit(1);
    });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
      });
    }
    
    if (pool) {
      try {
        await pool.end();
        console.log('Database pool closed');
      } catch (err) {
        console.error('Error closing database pool:', err);
      }
    }
    
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}
