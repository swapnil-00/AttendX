# AttendX - Attendance Management System

A modern, full-stack attendance tracking application built with React, Express, and PostgreSQL.

## Features

- 📊 Real-time attendance tracking with visual indicators
- 👥 Member management (add/remove)
- 📅 Monthly view with date navigation
- 📈 Statistics dashboard (present/absent counts, attendance rate)
- 📥 Excel export with formatted reports
- 🎨 Clean, responsive UI with smooth animations
- ⚡ Optimistic UI updates for instant feedback
- 🔒 Rate limiting and security best practices

## Tech Stack

### Frontend
- React 19 with Hooks
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API calls
- XLSX for Excel generation
- Lucide React for icons

### Backend
- Node.js with Express
- PostgreSQL (NeonDB)
- CORS and rate limiting
- Connection pooling

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or NeonDB account)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd AttendX
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

### Configuration

1. Server environment variables (create `server/.env`):
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

2. Client environment variables (create `client/.env`):
```env
VITE_API_URL=http://localhost:3001
```

See `.env.example` files for templates.

### Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. Start the client (in a new terminal):
```bash
cd client
npm run dev
```

3. Open http://localhost:5173 in your browser

## Project Structure

```
AttendX/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utility functions
│   │   ├── api.js         # API client
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── .env.example       # Environment template
│   └── package.json
│
├── server/                # Express backend
│   ├── index.js          # Server entry point
│   ├── .env.example      # Environment template
│   └── package.json
│
├── SECURITY.md           # Security documentation
└── README.md
```

## API Endpoints

### Persons
- `GET /api/persons` - Get all persons
- `POST /api/persons` - Add new person
- `DELETE /api/persons/:id` - Delete person

### Attendance
- `GET /api/attendance?month=YYYY-MM` - Get attendance for month
- `PUT /api/attendance` - Update/create attendance record

## Security Features

- Environment-based configuration
- CORS protection with configurable origins
- Rate limiting (100 requests per 15 minutes)
- SQL injection prevention via parameterized queries
- Input validation and sanitization
- XSS prevention
- Connection pool limits
- Request timeout handling
- Error boundaries for graceful failures

See [SECURITY.md](SECURITY.md) for detailed security information.

## Database Schema

### persons
- `id` - Serial primary key
- `name` - VARCHAR(255), unique
- `created_at` - Timestamp

### attendance
- `id` - Serial primary key
- `person_id` - Foreign key to persons
- `date` - Date
- `status` - CHAR(1), 'P' or 'A'
- `created_at` - Timestamp
- Unique constraint on (person_id, date)

## Development

### Code Quality
- Centralized utility functions
- Error boundaries for React components
- Global error handling
- Consistent code formatting
- Component-based architecture

### Performance Optimizations
- Batch database inserts for seeding
- Connection pooling with limits
- Optimistic UI updates
- Async Excel generation
- Request timeouts

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production`
2. Configure production database URL
3. Update CORS_ORIGINS to production domain
4. Set up HTTPS/TLS
5. Implement authentication
6. Configure monitoring and logging
7. Set up automated backups
8. Review [SECURITY.md](SECURITY.md) recommendations

## Known Issues

- xlsx library has known vulnerabilities (see SECURITY.md for mitigation)
- DNS workaround for NeonDB may not work in all network environments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open a GitHub issue.

---

Built with ♥ · Powered by NeonDB
