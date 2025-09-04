const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Create data directory if it doesn't exist
const DATA_DIR = path.join(__dirname, 'data', 'forms');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o750 });
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts and eval for demo
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use('/', express.static(path.join(__dirname, 'public')));

// Utility functions
const getFormFilePath = (id) => path.join(DATA_DIR, `${id}.json`);

const validateFormData = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return 'Invalid form data structure';
  }
  if (!formData.clientName || typeof formData.clientName !== 'string') {
    return 'Client name is required';
  }
  return null;
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'XYZ Custody Form Backend'
  });
});

// Get all forms (list view)
app.get('/api/forms', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR);
    const forms = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const formData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
          return {
            id: formData.id,
            clientName: formData.clientName,
            createdDate: formData.createdDate,
            lastModified: formData.lastModified,
            status: formData.status,
            completionPercentage: formData.completionPercentage || 0
          };
        } catch (error) {
          console.error(`Error reading form file ${file}:`, error);
          return null;
        }
      })
      .filter(form => form !== null)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json(forms);
  } catch (error) {
    console.error('Error getting forms:', error);
    res.status(500).json({ error: 'Failed to retrieve forms' });
  }
});

// Get specific form
app.get('/api/forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFormFilePath(id);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const formData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(formData);
  } catch (error) {
    console.error('Error getting form:', error);
    res.status(500).json({ error: 'Failed to retrieve form' });
  }
});

// Create new form
app.post('/api/forms', (req, res) => {
  try {
    const formData = req.body;
    
    // Validate form data
    const validationError = validateFormData(formData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Generate ID if not provided
    if (!formData.id) {
      formData.id = uuidv4();
    }

    // Set timestamps
    const now = new Date().toISOString();
    formData.createdDate = now;
    formData.lastModified = now;

    // Set default status
    if (!formData.status) {
      formData.status = 'draft';
    }

    const filePath = getFormFilePath(formData.id);
    
    // Check if form already exists
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: 'Form with this ID already exists' });
    }

    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(formData, null, 2), { mode: 0o640 });
    
    res.status(201).json({ 
      id: formData.id, 
      message: 'Form created successfully',
      clientName: formData.clientName 
    });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update existing form
app.put('/api/forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;
    const filePath = getFormFilePath(id);

    // Check if form exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Validate form data
    const validationError = validateFormData(formData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Get existing form data
    const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update form data
    formData.id = id;
    formData.createdDate = existingData.createdDate;
    formData.lastModified = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(filePath, JSON.stringify(formData, null, 2), { mode: 0o640 });
    
    res.json({ 
      id: formData.id, 
      message: 'Form updated successfully',
      clientName: formData.clientName 
    });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
app.delete('/api/forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFormFilePath(id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Form not found' });
    }

    fs.unlinkSync(filePath);
    
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Export form as JSON
app.get('/api/forms/:id/export', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFormFilePath(id);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const formData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const filename = `xyz-custody-form-${formData.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${id.substring(0, 8)}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(formData, null, 2));
  } catch (error) {
    console.error('Error exporting form:', error);
    res.status(500).json({ error: 'Failed to export form' });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 XYZ Custody Form Backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;