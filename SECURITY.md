# Security Notes

## Known Issues

### xlsx Library Vulnerability (Non-Critical)
The `xlsx` library (v0.18.5) has known vulnerabilities:
- Prototype Pollution (CVSS 7.8)
- Regular Expression Denial of Service (CVSS 7.5)

**Mitigation**: These vulnerabilities require local file access or user interaction. Since:
1. Excel files are generated client-side only (no server processing)
2. Users only download files they create themselves
3. No untrusted Excel files are uploaded or parsed
4. The library is not exposed to external inputs

The risk is minimal for this use case. However, monitor for updates to xlsx or consider alternatives like:
- `exceljs` - More actively maintained
- `sheetjs-style` - Community fork with security patches
- Server-side generation with validated libraries

## Security Best Practices Implemented

### Server
- ✅ Environment variables for sensitive data
- ✅ CORS restricted to configured origins
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Parameterized SQL queries (prevents SQL injection)
- ✅ Input validation on all endpoints
- ✅ Connection pool limits
- ✅ Request body size limits (10MB)
- ✅ XSS prevention (HTML tag rejection in names)

### Client
- ✅ Environment-based API configuration
- ✅ Request timeout (30 seconds)
- ✅ Error boundaries for graceful failure
- ✅ Global error handling
- ✅ Input sanitization

## Recommended for Production

### High Priority
1. Implement authentication (JWT, OAuth, or session-based)
2. Add HTTPS/TLS encryption
3. Implement role-based access control (RBAC)
4. Add audit logging for data changes
5. Set up error monitoring (Sentry, LogRocket)
6. Configure CSP headers
7. Add CSRF protection

### Medium Priority
1. Implement data backup strategy
2. Add request signing/verification
3. Set up monitoring and alerting
4. Implement session management
5. Add API versioning
6. Configure security headers (Helmet.js)

### Low Priority
1. Add honeypot fields for bot detection
2. Implement IP whitelisting for admin routes
3. Add two-factor authentication
4. Set up intrusion detection

## Environment Variables

Never commit these to version control:

### Server (.env)
```
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com
```

### Client (.env)
```
VITE_API_URL=https://api.yourdomain.com
```

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com instead of using the issue tracker.
