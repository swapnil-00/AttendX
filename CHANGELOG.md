# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-04-06

### Security Fixes
- ✅ Added `.env` files to `.gitignore` (credentials no longer in repo)
- ✅ Implemented rate limiting (100 requests per 15 minutes)
- ✅ Added environment-based CORS configuration
- ✅ Enhanced input validation with XSS prevention
- ✅ Added request timeout handling (30 seconds)
- ✅ Implemented connection pool limits (max 20 connections)
- ✅ Added request body size limits (10MB)

### Features
- ✅ Error boundaries for graceful React error handling
- ✅ Centralized date utility functions
- ✅ Loading states for Excel download
- ✅ Health check endpoint (`/health`)
- ✅ Graceful server shutdown handling
- ✅ Global error handling with user-friendly messages
- ✅ Environment variable configuration for both client and server

### Performance
- ✅ Batch database inserts for seeding (300+ individual queries → ~10 batch queries)
- ✅ Async Excel generation to prevent UI blocking
- ✅ Connection pooling with idle timeout (30 seconds)
- ✅ Connection timeout configuration (10 seconds)

### Code Quality
- ✅ Removed duplicate `normalizeDate()` functions
- ✅ Created shared utility modules
- ✅ Added comprehensive documentation (README, SECURITY, DEPLOYMENT)
- ✅ Improved error messages and logging
- ✅ Added process error handlers (uncaughtException, unhandledRejection)

### Documentation
- ✅ Created comprehensive README.md
- ✅ Added SECURITY.md with vulnerability notes and best practices
- ✅ Added DEPLOYMENT.md with multiple deployment options
- ✅ Created `.env.example` files for both client and server
- ✅ Added inline code comments for complex logic

### Known Issues
- ⚠️ xlsx library (v0.18.5) has known vulnerabilities - see SECURITY.md for mitigation
- ⚠️ DNS workaround for NeonDB may not work in all network environments

### Breaking Changes
- Environment variables now required (see `.env.example` files)
- API base URL must be configured via `VITE_API_URL`
- CORS origins must be explicitly configured via `CORS_ORIGINS`

## [1.0.0] - Initial Release

### Features
- Basic attendance tracking
- Member management
- Monthly view
- Excel export
- Statistics dashboard
- Optimistic UI updates
- Toast notifications
- Confirmation modals

### Tech Stack
- React 19
- Express 4
- PostgreSQL
- Vite
- Tailwind CSS
