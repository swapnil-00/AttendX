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

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : process.env.NODE_ENV === 'production'
  ? ['https://attend-x-btk6.vercel.app']
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Fix #12 — Apply rate limiting in all environments (strict in prod, lenient in dev)
const prodLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.ip ||
    'unknown',
});

const devLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // much more lenient in dev
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', process.env.NODE_ENV === 'production' ? prodLimiter : devLimiter);
app.use(express.json({ limit: '10mb' }));

// ─── API Key Auth Middleware (Fix #3) ─────────────────────────────────────────
// Protects mutating endpoints. Set API_KEY in server .env and
// VITE_API_KEY in client .env to the same value.
// If API_KEY is not configured, the check is skipped with a dev warning.
const requireApiKey = (req, res, next) => {
  if (!process.env.API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      // Warn but allow in development when key is not configured
      return next();
    }
    // In production, reject if API_KEY env var is missing — misconfigured server
    return res.status(500).json({ error: 'Server misconfigured: API_KEY not set' });
  }
  const key = req.headers['x-api-key'];
  if (key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ─── Health check ─────────────────────────────────────────────────────────────
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
      // Fix #2 — TLS certificate verification ENABLED (was rejectUnauthorized: false)
      // servername is used for both SNI and cert hostname verification in Node TLS,
      // so connecting by IP with servername set is fully secure.
      rejectUnauthorized: true,
      servername: dbUrl.hostname,
    },
    // Fix #4 — Lower pool size for serverless (avoids exhausting NeonDB connections)
    max: process.env.VERCEL ? 2 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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

    const personValues = Array.from({ length: 10 }, (_, i) => `('Person ${i + 1}')`).join(',');
    await pool.query(`INSERT INTO persons (name) VALUES ${personValues} ON CONFLICT (name) DO NOTHING`);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const persons = await pool.query('SELECT id FROM persons ORDER BY id ASC');

    const attendanceValues = [];
    for (const person of persons.rows) {
      for (let day = 1; day <= today; day++) {
        const status = Math.random() > 0.25 ? 'P' : 'A';
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        attendanceValues.push(`(${person.id}, '${dateStr}', '${status}')`);
      }
    }

    if (attendanceValues.length > 0) {
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

// requireApiKey applied — Fix #3
app.post('/api/persons', requireApiKey, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const trimmedName = name.trim();
    if (trimmedName.length > 255) {
      return res.status(400).json({ error: 'Name must be 255 characters or less' });
    }
    if (/<[^>]*>/g.test(trimmedName)) {
      return res.status(400).json({ error: 'Name contains invalid characters' });
    }

    const { rows } = await pool.query(
      'INSERT INTO persons (name) VALUES ($1) RETURNING *',
      [trimmedName]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `"${req.body.name.trim()}" already exists in the register.` });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// requireApiKey applied — Fix #3
app.delete('/api/persons/:id', requireApiKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid person ID' });

    // Fix #18 — Return 404 if person doesn't exist (was always returning success)
    const result = await pool.query(
      'DELETE FROM persons WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }
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

// requireApiKey applied — Fix #3
app.put('/api/attendance', requireApiKey, async (req, res) => {
  try {
    const { person_id, date, status } = req.body;

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

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) server.close(() => console.log('HTTP server closed'));
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

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}
