// Workflow Management Database Schema and Data Models
// Multi-tenant, Multi-user Group System

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Define user roles and groups
const USER_ROLES = {
  CLIENT: 'client',
  GCS: 'gcs',
  BBH_CLIENT_SERVICE: 'bbh_client_service',
  ADMIN: 'admin'
};

const WORKFLOW_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_GCS_REVIEW: 'under_gcs_review',
  GCS_REJECTED: 'gcs_rejected',
  ESCALATED_TO_BBH: 'escalated_to_bbh',
  BBH_REVIEW: 'bbh_review',
  BBH_APPROVED: 'bbh_approved',
  BBH_REJECTED: 'bbh_rejected',
  COMPLETED: 'completed'
};

// Data directories
const WORKFLOW_DATA_DIR = path.join(__dirname, 'data', 'workflows');
const USERS_DATA_DIR = path.join(__dirname, 'data', 'users');
const TENANTS_DATA_DIR = path.join(__dirname, 'data', 'tenants');

// Ensure directories exist
[WORKFLOW_DATA_DIR, USERS_DATA_DIR, TENANTS_DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o750 });
  }
});

// Tenant model
class Tenant {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.domain = data.domain; // e.g., 'client1.xyz.com'
    this.settings = data.settings || {};
    this.createdDate = data.createdDate || new Date().toISOString();
    this.isActive = data.isActive !== false;
  }

  save() {
    const filePath = path.join(TENANTS_DATA_DIR, `${this.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this, null, 2), { mode: 0o640 });
    return this;
  }

  static findById(id) {
    try {
      const filePath = path.join(TENANTS_DATA_DIR, `${id}.json`);
      if (!fs.existsSync(filePath)) return null;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return new Tenant(data);
    } catch (error) {
      return null;
    }
  }

  static findByDomain(domain) {
    try {
      const files = fs.readdirSync(TENANTS_DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = JSON.parse(fs.readFileSync(path.join(TENANTS_DATA_DIR, file), 'utf8'));
          if (data.domain === domain) {
            return new Tenant(data);
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static findAll() {
    try {
      const files = fs.readdirSync(TENANTS_DATA_DIR);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const data = JSON.parse(fs.readFileSync(path.join(TENANTS_DATA_DIR, file), 'utf8'));
          return new Tenant(data);
        })
        .filter(tenant => tenant.isActive);
    } catch (error) {
      return [];
    }
  }
}

// User model
class User {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.tenantId = data.tenantId;
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role; // CLIENT, GCS, BBH_CLIENT_SERVICE, ADMIN
    this.permissions = data.permissions || [];
    this.isActive = data.isActive !== false;
    this.createdDate = data.createdDate || new Date().toISOString();
    this.lastLogin = data.lastLogin;
    // Simple auth - in production, use proper password hashing
    this.passwordHash = data.passwordHash;
  }

  save() {
    const filePath = path.join(USERS_DATA_DIR, `${this.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this, null, 2), { mode: 0o640 });
    return this;
  }

  static findById(id) {
    try {
      const filePath = path.join(USERS_DATA_DIR, `${id}.json`);
      if (!fs.existsSync(filePath)) return null;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return new User(data);
    } catch (error) {
      return null;
    }
  }

  static findByUsername(username, tenantId) {
    try {
      const files = fs.readdirSync(USERS_DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = JSON.parse(fs.readFileSync(path.join(USERS_DATA_DIR, file), 'utf8'));
          if (data.username === username && data.tenantId === tenantId && data.isActive) {
            return new User(data);
          }
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static findByTenant(tenantId) {
    try {
      const files = fs.readdirSync(USERS_DATA_DIR);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const data = JSON.parse(fs.readFileSync(path.join(USERS_DATA_DIR, file), 'utf8'));
          return new User(data);
        })
        .filter(user => user.tenantId === tenantId && user.isActive);
    } catch (error) {
      return [];
    }
  }

  static findByRole(role, tenantId = null) {
    try {
      const files = fs.readdirSync(USERS_DATA_DIR);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const data = JSON.parse(fs.readFileSync(path.join(USERS_DATA_DIR, file), 'utf8'));
          return new User(data);
        })
        .filter(user => {
          const roleMatch = user.role === role && user.isActive;
          return tenantId ? roleMatch && user.tenantId === tenantId : roleMatch;
        });
    } catch (error) {
      return [];
    }
  }

  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  hasPermission(permission) {
    return this.permissions.includes(permission) || this.role === USER_ROLES.ADMIN;
  }
}

// Workflow model
class Workflow {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.tenantId = data.tenantId;
    this.formId = data.formId; // Reference to the form submission
    this.clientId = data.clientId; // User who submitted
    this.status = data.status || WORKFLOW_STATUSES.DRAFT;
    this.currentAssignee = data.currentAssignee; // Current user handling this workflow
    this.priority = data.priority || 'medium'; // low, medium, high, urgent
    this.title = data.title;
    this.description = data.description;
    this.files = data.files || []; // Array of file references
    this.comments = data.comments || [];
    this.history = data.history || [];
    this.metadata = data.metadata || {};
    this.createdDate = data.createdDate || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
    this.dueDate = data.dueDate;
    this.completedDate = data.completedDate;
  }

  save() {
    this.lastModified = new Date().toISOString();
    const filePath = path.join(WORKFLOW_DATA_DIR, `${this.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this, null, 2), { mode: 0o640 });
    return this;
  }

  static findById(id) {
    try {
      const filePath = path.join(WORKFLOW_DATA_DIR, `${id}.json`);
      if (!fs.existsSync(filePath)) return null;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return new Workflow(data);
    } catch (error) {
      return null;
    }
  }

  static findByTenant(tenantId, filters = {}) {
    try {
      const files = fs.readdirSync(WORKFLOW_DATA_DIR);
      let workflows = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const data = JSON.parse(fs.readFileSync(path.join(WORKFLOW_DATA_DIR, file), 'utf8'));
          return new Workflow(data);
        })
        .filter(workflow => workflow.tenantId === tenantId);

      // Apply filters
      if (filters.status) {
        workflows = workflows.filter(w => w.status === filters.status);
      }
      if (filters.assignee) {
        workflows = workflows.filter(w => w.currentAssignee === filters.assignee);
      }
      if (filters.clientId) {
        workflows = workflows.filter(w => w.clientId === filters.clientId);
      }
      if (filters.priority) {
        workflows = workflows.filter(w => w.priority === filters.priority);
      }

      // Sort by last modified (newest first)
      return workflows.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    } catch (error) {
      return [];
    }
  }

  static findByUser(userId, tenantId) {
    try {
      const files = fs.readdirSync(WORKFLOW_DATA_DIR);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const data = JSON.parse(fs.readFileSync(path.join(WORKFLOW_DATA_DIR, file), 'utf8'));
          return new Workflow(data);
        })
        .filter(workflow => 
          workflow.tenantId === tenantId && 
          (workflow.clientId === userId || workflow.currentAssignee === userId)
        )
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    } catch (error) {
      return [];
    }
  }

  addComment(userId, comment, isInternal = false) {
    const commentObj = {
      id: uuidv4(),
      userId,
      comment,
      isInternal, // Internal comments only visible to GCS/BBH staff
      timestamp: new Date().toISOString()
    };
    this.comments.push(commentObj);
    this.addHistoryEntry(`Comment added`, userId);
    return this;
  }

  addHistoryEntry(action, userId, details = {}) {
    const historyEntry = {
      id: uuidv4(),
      action,
      userId,
      timestamp: new Date().toISOString(),
      details
    };
    this.history.push(historyEntry);
    return this;
  }

  updateStatus(newStatus, userId, comment = null) {
    const oldStatus = this.status;
    this.status = newStatus;
    
    const details = { oldStatus, newStatus };
    if (comment) {
      details.comment = comment;
    }
    
    this.addHistoryEntry(`Status changed from ${oldStatus} to ${newStatus}`, userId, details);
    
    if (comment) {
      this.addComment(userId, comment, true);
    }

    // Set completion date if workflow is completed
    if (newStatus === WORKFLOW_STATUSES.COMPLETED || 
        newStatus === WORKFLOW_STATUSES.BBH_APPROVED ||
        newStatus === WORKFLOW_STATUSES.BBH_REJECTED) {
      this.completedDate = new Date().toISOString();
    }

    return this;
  }

  assign(userId, assigneeId) {
    const oldAssignee = this.currentAssignee;
    this.currentAssignee = assigneeId;
    this.addHistoryEntry(`Assigned to user`, userId, { oldAssignee, newAssignee: assigneeId });
    return this;
  }

  canUserAccess(user) {
    // Admin can access all workflows in their tenant
    if (user.role === USER_ROLES.ADMIN) {
      return user.tenantId === this.tenantId;
    }

    // Client can only access their own workflows
    if (user.role === USER_ROLES.CLIENT) {
      return user.tenantId === this.tenantId && user.id === this.clientId;
    }

    // GCS and BBH can access all workflows in their tenant
    if (user.role === USER_ROLES.GCS || user.role === USER_ROLES.BBH_CLIENT_SERVICE) {
      return user.tenantId === this.tenantId;
    }

    return false;
  }

  canUserEdit(user) {
    if (!this.canUserAccess(user)) return false;

    // Admin can edit everything
    if (user.role === USER_ROLES.ADMIN) return true;

    // Client can only edit draft workflows
    if (user.role === USER_ROLES.CLIENT) {
      return user.id === this.clientId && this.status === WORKFLOW_STATUSES.DRAFT;
    }

    // GCS and BBH can edit workflows assigned to them or in review states
    if (user.role === USER_ROLES.GCS) {
      return [WORKFLOW_STATUSES.SUBMITTED, WORKFLOW_STATUSES.UNDER_GCS_REVIEW].includes(this.status);
    }

    if (user.role === USER_ROLES.BBH_CLIENT_SERVICE) {
      return [WORKFLOW_STATUSES.ESCALATED_TO_BBH, WORKFLOW_STATUSES.BBH_REVIEW].includes(this.status);
    }

    return false;
  }
}

// WorkflowFile model for file attachments
class WorkflowFile {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.workflowId = data.workflowId;
    this.fileName = data.fileName;
    this.originalName = data.originalName;
    this.mimeType = data.mimeType;
    this.fileSize = data.fileSize;
    this.uploadedBy = data.uploadedBy;
    this.uploadedDate = data.uploadedDate || new Date().toISOString();
    this.filePath = data.filePath; // Server file path
    this.isDeleted = data.isDeleted || false;
  }
}

// Initialize default tenants and users for demo
function initializeDefaultData() {
  // Create default tenants
  const defaultTenants = [
    { name: 'XYZ Bank', domain: 'xyz.bank.com' },
    { name: 'Client Corp', domain: 'client.corp.com' },
    { name: 'Global Finance Ltd', domain: 'global.finance.com' }
  ];

  defaultTenants.forEach(tenantData => {
    const existing = Tenant.findByDomain(tenantData.domain);
    if (!existing) {
      const tenant = new Tenant(tenantData);
      tenant.save();
      console.log(`Created tenant: ${tenant.name}`);

      // Create default users for each tenant
      const defaultUsers = [
        {
          tenantId: tenant.id,
          username: 'client1',
          email: 'client1@' + tenantData.domain,
          firstName: 'John',
          lastName: 'Smith',
          role: USER_ROLES.CLIENT,
          passwordHash: 'demo123' // In production, use proper password hashing
        },
        {
          tenantId: tenant.id,
          username: 'gcs1',
          email: 'gcs1@xyz.bank.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: USER_ROLES.GCS,
          passwordHash: 'demo123'
        },
        {
          tenantId: tenant.id,
          username: 'bbh1',
          email: 'bbh1@xyz.bank.com',
          firstName: 'Michael',
          lastName: 'Brown',
          role: USER_ROLES.BBH_CLIENT_SERVICE,
          passwordHash: 'demo123'
        },
        {
          tenantId: tenant.id,
          username: 'admin1',
          email: 'admin1@xyz.bank.com',
          firstName: 'Admin',
          lastName: 'User',
          role: USER_ROLES.ADMIN,
          passwordHash: 'demo123'
        }
      ];

      defaultUsers.forEach(userData => {
        const user = new User(userData);
        user.save();
        console.log(`Created user: ${user.username} (${user.role}) for ${tenant.name}`);
      });
    }
  });
}

module.exports = {
  USER_ROLES,
  WORKFLOW_STATUSES,
  Tenant,
  User,
  Workflow,
  WorkflowFile,
  initializeDefaultData,
  WORKFLOW_DATA_DIR,
  USERS_DATA_DIR,
  TENANTS_DATA_DIR
};