# XYZ Custody Form - Development Setup

Complete setup instructions for the XYZ Custody Account Opening Form application with backend API.

## Architecture Overview

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│     Angular Frontend        │    │      Express Backend       │
│     (Port 4200)             │◄───┤      (Port 3001)           │
│                             │    │                             │
│ • Form Components           │    │ • REST API                  │
│ • Conditional Logic         │    │ • File Storage              │
│ • Material UI               │    │ • Security & Validation     │
└─────────────────────────────┘    └─────────────────────────────┘
                                             │
                                   ┌─────────────────┐
                                   │  File Storage   │
                                   │  ./data/forms/  │
                                   │  *.json files   │
                                   └─────────────────┘
```

## Prerequisites

- Node.js 18+ 
- npm 9+
- Git

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd xyz-custody-form-angular
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ..  # Back to project root
npm install
```

### 4. Environment Setup
```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your settings if needed
```

## Development

### Option 1: Start Both Services (Recommended)
```bash
# From project root - starts both backend and frontend
npm run start:full
```

### Option 2: Start Services Separately
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend (from project root)
npm start
```

## Access Points

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## API Endpoints

### Forms Management
```
GET    /api/forms              # List all forms
GET    /api/forms/:id          # Get specific form
POST   /api/forms              # Create new form
PUT    /api/forms/:id          # Update form
DELETE /api/forms/:id          # Delete form
GET    /api/forms/:id/export   # Export form as JSON
```

## Project Structure

```
xyz-custody-form-angular/
├── backend/                    # Express.js API server
│   ├── data/forms/            # JSON form storage
│   ├── package.json
│   ├── server.js              # Main server file
│   └── README.md
├── src/                       # Angular application
│   ├── app/
│   │   └── services/
│   │       └── form-api.service.ts
│   └── ...
├── form-metadata.json         # Form structure & conditionals
├── proxy.conf.json           # Development proxy config
├── package.json              # Frontend dependencies
└── README.md                 # Project documentation
```

## Form Data Storage

Forms are stored as individual JSON files in `backend/data/forms/`:
```
backend/data/forms/
├── 12345678-abcd-1234-efgh-123456789012.json
├── 87654321-dcba-4321-hgfe-210987654321.json
└── ...
```

Each form file contains:
```json
{
  "id": "uuid",
  "clientName": "Client Company Name",
  "createdDate": "2024-01-01T00:00:00Z",
  "lastModified": "2024-01-01T00:00:00Z",
  "status": "draft|submitted|archived",
  "completionPercentage": 85,
  "formData": { ... }
}
```

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Restricted origins
- **Rate Limiting**: 100 requests/15min per IP
- **File Permissions**: Restricted access (0o640)
- **Input Validation**: Form data validation

## Production Deployment

### 1. Build Frontend
```bash
npm run build
# Serves built files from backend/public/
```

### 2. Backend Configuration
```bash
cd backend
NODE_ENV=production npm start
```

### 3. Reverse Proxy Setup (nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup Strategy

```bash
# Manual backup
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/

# Automated backup (cron)
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Backend Issues
```bash
# Check backend health
curl http://localhost:3001/api/health

# Check backend logs
cd backend && npm run dev

# Verify data directory
ls -la backend/data/forms/
```

### Frontend Issues
```bash
# Check proxy configuration
cat proxy.conf.json

# Restart with fresh install
rm -rf node_modules package-lock.json
npm install
npm start
```

### Common Issues

1. **Port conflicts**: Change ports in backend/server.js or proxy.conf.json
2. **CORS errors**: Check backend CORS configuration
3. **File permissions**: Ensure backend can write to data directory
4. **Memory issues**: Increase Node.js heap size for large forms

## Testing

```bash
# Test backend API
curl -X POST http://localhost:3001/api/forms \
  -H "Content-Type: application/json" \
  -d '{"clientName": "Test Client", "formData": {}}'

# Test frontend (after starting)
# Navigate to http://localhost:4200
```