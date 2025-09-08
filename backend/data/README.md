# Sample Data Directory

This directory contains pre-populated sample data for the XYZ Custody Workflow Management System.

## Structure

```
data/
├── tenants/     # Tenant organization data (3 sample tenants)
├── users/       # User account data (12 sample users, 4 per tenant)
├── workflows/   # Sample workflow submissions (225+ workflows)
└── forms/       # Legacy form data (for backwards compatibility)
```

## Sample Organizations

1. **XYZ Bank** (`xyz.bank.com`) - Primary banking institution
2. **Client Corp** (`client.corp.com`) - Corporate client
3. **Global Finance Ltd** (`global.finance.com`) - Financial services company

## Sample Users per Organization

Each tenant has 4 pre-configured users:

- **Client User** (`client1`) - Can create and submit forms
- **GCS User** (`gcs1`) - Can review and approve/reject submissions  
- **BBH User** (`bbh1`) - Can handle escalated cases
- **Admin User** (`admin1`) - Full system access

**Default Password**: `demo123` (for demo purposes only)

## Sample Workflows

The system includes ~75 sample workflows per tenant covering all workflow states:

- **Draft** - Workflows still being prepared by clients
- **Submitted** - Ready for GCS review
- **Under GCS Review** - Currently being reviewed by GCS staff
- **GCS Rejected** - Rejected by GCS, returned to client
- **Escalated to BBH** - Complex cases requiring BBH review
- **BBH Review** - Under review by BBH Client Service
- **BBH Approved** - Approved by BBH for final processing
- **BBH Rejected** - Rejected by BBH
- **Completed** - Successfully processed

## Automatic Data Creation

The server automatically creates this sample data on first startup if it doesn't exist. The creation process is idempotent - it won't recreate data if sample data already exists.

## For Developers

When users fork this project, they will automatically have access to this rich sample dataset, allowing them to:

- Test the full workflow management functionality immediately
- Explore different user roles and permissions
- See realistic workflow data across multiple states
- Understand the multi-tenant architecture

The sample data provides a complete working environment without requiring manual setup.