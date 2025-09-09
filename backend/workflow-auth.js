// Authentication and Authorization Middleware
const { User, Tenant, USER_ROLES } = require('./workflow-schema');

// Simple session store (in production, use Redis or database)
const sessions = new Map();

// Middleware to authenticate users
const authenticate = (req, res, next) => {
  const sessionToken = req.headers['x-session-token'] || req.cookies?.sessionToken;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = sessions.get(sessionToken);
  if (!session || session.expires < Date.now()) {
    sessions.delete(sessionToken);
    return res.status(401).json({ error: 'Session expired' });
  }

  // Extend session
  session.expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  req.user = session.user;
  req.sessionToken = sessionToken;
  next();
};

// Middleware to check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Middleware to ensure multi-tenant isolation
const enforceTenantIsolation = (req, res, next) => {
  if (!req.user || !req.user.tenantId) {
    return res.status(401).json({ error: 'Invalid user session' });
  }

  // Add tenant filter to query parameters
  req.tenantId = req.user.tenantId;
  next();
};

// Login function
const login = async (username, password, tenantDomain) => {
  try {
    // Find tenant by domain
    const tenant = Tenant.findByDomain(tenantDomain);
    if (!tenant || !tenant.isActive) {
      throw new Error('Invalid tenant domain');
    }

    // Find user
    const user = User.findByUsername(username, tenant.id);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Simple password check (in production, use proper password hashing)
    if (user.passwordHash !== password) {
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionToken = require('crypto').randomBytes(32).toString('hex');
    const session = {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain
      },
      created: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    sessions.set(sessionToken, session);

    // Update user last login
    user.lastLogin = new Date().toISOString();
    user.save();

    return {
      sessionToken,
      user: session.user,
      tenant: session.tenant
    };
  } catch (error) {
    throw error;
  }
};

// Logout function
const logout = (sessionToken) => {
  if (sessionToken && sessions.has(sessionToken)) {
    sessions.delete(sessionToken);
    return true;
  }
  return false;
};

// Get current user info
const getCurrentUser = (sessionToken) => {
  const session = sessions.get(sessionToken);
  if (session && session.expires > Date.now()) {
    return {
      user: session.user,
      tenant: session.tenant
    };
  }
  return null;
};

// Check if user can access workflow
const canAccessWorkflow = (user, workflow) => {
  return workflow.canUserAccess(user);
};

// Check if user can edit workflow
const canEditWorkflow = (user, workflow) => {
  return workflow.canUserEdit(user);
};

// Permission middleware for specific actions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userPermissions: req.user.permissions
      });
    }

    next();
  };
};

// Clean expired sessions (call periodically)
const cleanupSessions = () => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) {
      sessions.delete(token);
    }
  }
};

// Cleanup expired sessions every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

module.exports = {
  authenticate,
  requireRole,
  enforceTenantIsolation,
  requirePermission,
  login,
  logout,
  getCurrentUser,
  canAccessWorkflow,
  canEditWorkflow,
  cleanupSessions,
  USER_ROLES
};