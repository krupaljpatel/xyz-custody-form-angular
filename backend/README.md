# XYZ Custody Form Backend

Express.js backend API for the XYZ Custody Account Opening Form application with file-based storage.

## Features

- 🔒 **Secure**: Helmet security headers, rate limiting, CORS protection
- 📁 **File-based Storage**: JSON files stored locally on-premises
- 🚀 **RESTful API**: Full CRUD operations for form management
- 📤 **Export**: Download forms as JSON files
- ⚡ **Fast**: Lightweight Express server
- 🛡️ **Validation**: Form data validation and error handling

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Forms Management
- `GET /api/forms` - Get all forms (list view)
- `GET /api/forms/:id` - Get specific form
- `POST /api/forms` - Create new form
- `PUT /api/forms/:id` - Update existing form
- `DELETE /api/forms/:id` - Delete form
- `GET /api/forms/:id/export` - Export form as JSON file

## Installation

```bash
cd backend
npm install
```

## Development

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

## Configuration

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

## Data Storage

Forms are stored as JSON files in `./data/forms/` directory:
- Each form is a separate `.json` file named by UUID
- File permissions set to `0o640` for security
- Automatic directory creation with proper permissions

## Form Data Structure

```json
{
  "id": "uuid-v4",
  "clientName": "Client Company Name",
  "createdDate": "2024-01-01T00:00:00.000Z",
  "lastModified": "2024-01-01T00:00:00.000Z", 
  "status": "draft|submitted|archived",
  "completionPercentage": 85,
  "formData": {
    "section1": { ... },
    "section2": { ... }
  }
}
```

## Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Restricted to allowed origins
- **File Permissions**: Restricted access to data files
- **Input Validation**: Form data validation
- **Error Handling**: Secure error responses

## Backup Strategy

```bash
# Manual backup
cp -r data/forms backups/forms-$(date +%Y%m%d)

# Automated backup (add to cron)
0 2 * * * /path/to/backup-script.sh
```

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Configure reverse proxy (nginx/Apache)
3. Set up SSL certificates
4. Configure firewall rules
5. Set up automated backups
6. Monitor disk space for form storage

## Testing

```bash
# Test server health
curl http://localhost:3001/api/health

# Test form creation
curl -X POST http://localhost:3001/api/forms \
  -H "Content-Type: application/json" \
  -d '{"clientName": "Test Client", "formData": {}}'
```