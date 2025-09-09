// Workflow Management API Routes
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { 
  Workflow, 
  User, 
  Tenant, 
  WorkflowFile,
  WORKFLOW_STATUSES, 
  USER_ROLES 
} = require('./workflow-schema');

const { 
  authenticate, 
  requireRole, 
  enforceTenantIsolation,
  login,
  logout,
  getCurrentUser,
  canAccessWorkflow,
  canEditWorkflow
} = require('./workflow-auth');

// Middleware to bypass authentication for demo purposes
const bypassAuth = (req, res, next) => {
  if (req.headers['x-bypass-auth'] === 'true') {
    // Set up a default user context for demo (using actual XYZ Bank GCS user)
    req.user = {
      id: '982e14ed-4bc2-4954-92b3-320eb2f3c7d3',
      tenantId: '2b0a26a5-5108-4be1-ae84-b678c79a3f70',
      username: 'gcs1',
      email: 'gcs1@xyz.bank.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'gcs',
      permissions: ['read_workflows', 'review_workflows', 'approve_workflows']
    };
    req.tenantId = '2b0a26a5-5108-4be1-ae84-b678c79a3f70';
    req.sessionToken = 'bypass-auth';
    return next();
  }
  return authenticate(req, res, next);
};

const router = express.Router();

// Setup file upload with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'data', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o750 });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Authentication Routes

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password, tenantDomain } = req.body;
    
    if (!username || !password || !tenantDomain) {
      return res.status(400).json({ error: 'Username, password, and tenant domain are required' });
    }

    const result = await login(username, password, tenantDomain);
    
    // Set session cookie
    res.cookie('sessionToken', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      user: result.user,
      tenant: result.tenant
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/auth/logout', bypassAuth, (req, res) => {
  logout(req.sessionToken);
  res.clearCookie('sessionToken');
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/auth/me', bypassAuth, (req, res) => {
  res.json({
    user: req.user,
    tenant: req.tenant
  });
});

// Workflow Routes

// Get workflows for current user
router.get('/workflows', bypassAuth, (req, res) => {
  try {
    const { status, priority, assignee } = req.query;
    let workflows;

    console.log('=== Workflow API Debug ===');
    console.log('User:', req.user.username, 'Role:', req.user.role);
    console.log('Tenant ID:', req.tenantId);
    console.log('Headers:', req.headers['x-bypass-auth']);
    
    // Test if Workflow class is working
    const allFiles = require('fs').readdirSync(require('path').join(__dirname, 'data', 'workflows'));
    console.log('Total workflow files found:', allFiles.length);
    
    if (req.user.role === USER_ROLES.CLIENT) {
      // Clients only see their own workflows
      workflows = Workflow.findByUser(req.user.id, req.tenantId);
      console.log('Client workflows found:', workflows.length);
    } else {
      // GCS, BBH, and Admin see all workflows in tenant
      const filters = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (assignee) filters.assignee = assignee;
      
      console.log('Calling Workflow.findByTenant with tenantId:', req.tenantId);
      workflows = Workflow.findByTenant(req.tenantId, filters);
      console.log('Staff workflows found:', workflows.length);
      
      if (workflows.length > 0) {
        console.log('First few workflow details:', workflows.slice(0,3).map(w => ({ 
          id: w.id, 
          title: w.title, 
          status: w.status, 
          tenantId: w.tenantId 
        })));
      } else {
        console.log('No workflows found - checking tenant ID match...');
        // Sample a file to check tenant ID
        if (allFiles.length > 0) {
          const sampleFile = allFiles[0];
          const sampleData = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'data', 'workflows', sampleFile), 'utf8'));
          console.log('Sample workflow tenantId:', sampleData.tenantId);
          console.log('Expected tenantId:', req.tenantId);
          console.log('Match?', sampleData.tenantId === req.tenantId);
        }
      }
    }

    // Add user information to workflows
    const workflowsWithUsers = workflows.map(workflow => {
      const client = User.findById(workflow.clientId);
      const assignee = workflow.currentAssignee ? User.findById(workflow.currentAssignee) : null;
      
      return {
        ...workflow,
        client: client ? {
          id: client.id,
          name: client.getFullName(),
          email: client.email
        } : null,
        assignee: assignee ? {
          id: assignee.id,
          name: assignee.getFullName(),
          email: assignee.email,
          role: assignee.role
        } : null
      };
    });

    res.json(workflowsWithUsers);
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({ error: 'Failed to retrieve workflows' });
  }
});

// Get specific workflow
router.get('/workflows/:id', bypassAuth, (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!canAccessWorkflow(req.user, workflow)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add user information
    const client = User.findById(workflow.clientId);
    const assignee = workflow.currentAssignee ? User.findById(workflow.currentAssignee) : null;

    // Add user information to comments and history
    const commentsWithUsers = workflow.comments.map(comment => {
      const user = User.findById(comment.userId);
      return {
        ...comment,
        user: user ? {
          id: user.id,
          name: user.getFullName(),
          role: user.role
        } : null
      };
    });

    const historyWithUsers = workflow.history.map(entry => {
      const user = User.findById(entry.userId);
      return {
        ...entry,
        user: user ? {
          id: user.id,
          name: user.getFullName(),
          role: user.role
        } : null
      };
    });

    res.json({
      ...workflow,
      client: client ? {
        id: client.id,
        name: client.getFullName(),
        email: client.email
      } : null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.getFullName(),
        email: assignee.email,
        role: assignee.role
      } : null,
      comments: commentsWithUsers,
      history: historyWithUsers
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow' });
  }
});

// Create new workflow
router.post('/workflows', bypassAuth, (req, res) => {
  try {
    const { title, description, formId, priority, files } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const workflow = new Workflow({
      tenantId: req.tenantId,
      clientId: req.user.id,
      title,
      description,
      formId,
      priority: priority || 'medium',
      status: WORKFLOW_STATUSES.DRAFT,
      files: files || []
    });

    workflow.addHistoryEntry('Workflow created', req.user.id);
    workflow.save();

    res.status(201).json({
      id: workflow.id,
      message: 'Workflow created successfully',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/workflows/:id', bypassAuth, (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!canEditWorkflow(req.user, workflow)) {
      return res.status(403).json({ error: 'Cannot edit this workflow' });
    }

    const { title, description, priority } = req.body;
    
    let hasChanges = false;
    if (title && title !== workflow.title) {
      workflow.title = title;
      hasChanges = true;
    }
    
    if (description && description !== workflow.description) {
      workflow.description = description;
      hasChanges = true;
    }
    
    if (priority && priority !== workflow.priority) {
      workflow.priority = priority;
      hasChanges = true;
    }

    if (hasChanges) {
      workflow.addHistoryEntry('Workflow updated', req.user.id);
      workflow.save();
    }

    res.json({
      message: 'Workflow updated successfully',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Submit workflow for review
router.post('/workflows/:id/submit', bypassAuth, (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Only the workflow owner can submit it' });
    }

    if (workflow.status !== WORKFLOW_STATUSES.DRAFT) {
      return res.status(400).json({ error: 'Only draft workflows can be submitted' });
    }

    const { comment } = req.body;

    workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, req.user.id, comment);
    
    // Auto-assign to first available GCS user
    const gcsUsers = User.findByRole(USER_ROLES.GCS, req.tenantId);
    if (gcsUsers.length > 0) {
      workflow.assign(req.user.id, gcsUsers[0].id);
      workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, req.user.id);
    }

    workflow.save();

    res.json({
      message: 'Workflow submitted successfully',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error submitting workflow:', error);
    res.status(500).json({ error: 'Failed to submit workflow' });
  }
});

// GCS approve workflow
router.post('/workflows/:id/gcs-approve', bypassAuth, requireRole(USER_ROLES.GCS, USER_ROLES.ADMIN), (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== WORKFLOW_STATUSES.UNDER_GCS_REVIEW) {
      return res.status(400).json({ error: 'Workflow is not in GCS review status' });
    }

    const { comment } = req.body;

    workflow.updateStatus(WORKFLOW_STATUSES.COMPLETED, req.user.id, comment);
    workflow.save();

    res.json({
      message: 'Workflow approved by GCS',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error approving workflow:', error);
    res.status(500).json({ error: 'Failed to approve workflow' });
  }
});

// GCS reject workflow
router.post('/workflows/:id/gcs-reject', bypassAuth, requireRole(USER_ROLES.GCS, USER_ROLES.ADMIN), (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== WORKFLOW_STATUSES.UNDER_GCS_REVIEW) {
      return res.status(400).json({ error: 'Workflow is not in GCS review status' });
    }

    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required for rejection' });
    }

    workflow.updateStatus(WORKFLOW_STATUSES.GCS_REJECTED, req.user.id, comment);
    workflow.save();

    res.json({
      message: 'Workflow rejected by GCS',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error rejecting workflow:', error);
    res.status(500).json({ error: 'Failed to reject workflow' });
  }
});

// GCS escalate to BBH
router.post('/workflows/:id/escalate', bypassAuth, requireRole(USER_ROLES.GCS, USER_ROLES.ADMIN), (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== WORKFLOW_STATUSES.UNDER_GCS_REVIEW) {
      return res.status(400).json({ error: 'Workflow is not in GCS review status' });
    }

    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required for escalation' });
    }

    workflow.updateStatus(WORKFLOW_STATUSES.ESCALATED_TO_BBH, req.user.id, comment);
    
    // Auto-assign to first available BBH user
    const bbhUsers = User.findByRole(USER_ROLES.BBH_CLIENT_SERVICE, req.tenantId);
    if (bbhUsers.length > 0) {
      workflow.assign(req.user.id, bbhUsers[0].id);
      workflow.updateStatus(WORKFLOW_STATUSES.BBH_REVIEW, req.user.id);
    }

    workflow.save();

    res.json({
      message: 'Workflow escalated to BBH Client Service',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error escalating workflow:', error);
    res.status(500).json({ error: 'Failed to escalate workflow' });
  }
});

// BBH approve workflow
router.post('/workflows/:id/bbh-approve', bypassAuth, requireRole(USER_ROLES.BBH_CLIENT_SERVICE, USER_ROLES.ADMIN), (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== WORKFLOW_STATUSES.BBH_REVIEW) {
      return res.status(400).json({ error: 'Workflow is not in BBH review status' });
    }

    const { comment } = req.body;

    workflow.updateStatus(WORKFLOW_STATUSES.BBH_APPROVED, req.user.id, comment);
    workflow.save();

    res.json({
      message: 'Workflow approved by BBH Client Service',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error approving workflow:', error);
    res.status(500).json({ error: 'Failed to approve workflow' });
  }
});

// BBH reject workflow
router.post('/workflows/:id/bbh-reject', bypassAuth, requireRole(USER_ROLES.BBH_CLIENT_SERVICE, USER_ROLES.ADMIN), (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== WORKFLOW_STATUSES.BBH_REVIEW) {
      return res.status(400).json({ error: 'Workflow is not in BBH review status' });
    }

    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required for rejection' });
    }

    workflow.updateStatus(WORKFLOW_STATUSES.BBH_REJECTED, req.user.id, comment);
    workflow.save();

    res.json({
      message: 'Workflow rejected by BBH Client Service',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error rejecting workflow:', error);
    res.status(500).json({ error: 'Failed to reject workflow' });
  }
});

// Add comment to workflow
router.post('/workflows/:id/comments', bypassAuth, (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!canAccessWorkflow(req.user, workflow)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { comment, isInternal } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Only GCS and BBH can add internal comments
    const canAddInternal = [USER_ROLES.GCS, USER_ROLES.BBH_CLIENT_SERVICE, USER_ROLES.ADMIN].includes(req.user.role);
    const internal = isInternal && canAddInternal;

    workflow.addComment(req.user.id, comment, internal);
    workflow.save();

    res.json({
      message: 'Comment added successfully',
      workflow: workflow
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Upload file to workflow
router.post('/workflows/:id/files', bypassAuth, upload.single('file'), (req, res) => {
  try {
    const workflow = Workflow.findById(req.params.id);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (!canEditWorkflow(req.user, workflow)) {
      return res.status(403).json({ error: 'Cannot upload files to this workflow' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workflowFile = new WorkflowFile({
      workflowId: workflow.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      filePath: req.file.path
    });

    workflow.files.push(workflowFile);
    workflow.addHistoryEntry('File uploaded', req.user.id, { fileName: req.file.originalname });
    workflow.save();

    res.json({
      message: 'File uploaded successfully',
      file: workflowFile
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get workflow statistics
router.get('/workflows/stats/dashboard', bypassAuth, (req, res) => {
  try {
    const workflows = Workflow.findByTenant(req.tenantId);
    
    const stats = {
      total: workflows.length,
      byStatus: {},
      byPriority: {},
      myWorkflows: 0,
      assignedToMe: 0
    };

    // Initialize status counts
    Object.values(WORKFLOW_STATUSES).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Initialize priority counts
    ['low', 'medium', 'high', 'urgent'].forEach(priority => {
      stats.byPriority[priority] = 0;
    });

    workflows.forEach(workflow => {
      stats.byStatus[workflow.status] = (stats.byStatus[workflow.status] || 0) + 1;
      stats.byPriority[workflow.priority] = (stats.byPriority[workflow.priority] || 0) + 1;
      
      if (workflow.clientId === req.user.id) {
        stats.myWorkflows++;
      }
      
      if (workflow.currentAssignee === req.user.id) {
        stats.assignedToMe++;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow statistics' });
  }
});

module.exports = router;