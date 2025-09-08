// Sample Data Generator for Workflow Management System
const { Workflow, User, Tenant, WORKFLOW_STATUSES, USER_ROLES } = require('./workflow-schema');

function createSampleData() {
  console.log('🎯 Creating sample data for workflow demonstration...');
  
  // Get all tenants to create data for each
  const tenants = Tenant.findAll();
  
  tenants.forEach(tenant => {
    console.log(`Checking sample data for tenant: ${tenant.name}`);
    
    // Check if sample data already exists for this tenant
    const existingWorkflows = Workflow.findByTenant(tenant.id);
    if (existingWorkflows.length >= 9) {
      console.log(`✅ Sample data already exists for ${tenant.name} (${existingWorkflows.length} workflows)`);
      return;
    }
    
    console.log(`Creating sample data for tenant: ${tenant.name}`);
    
    // Get users for this tenant
    const client = User.findByRole(USER_ROLES.CLIENT, tenant.id)[0];
    const gcs = User.findByRole(USER_ROLES.GCS, tenant.id)[0];
    const bbh = User.findByRole(USER_ROLES.BBH_CLIENT_SERVICE, tenant.id)[0];
    
    if (!client || !gcs || !bbh) {
      console.log(`Skipping ${tenant.name} - missing required users`);
      return;
    }

    // Sample form submissions in different states
    const sampleWorkflows = [
      // 1. Draft form (client still working on it)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'XYZ Custody Account Setup - Acme Corp',
        description: 'New custody account opening form for Acme Corporation. Setting up securities custody services with multi-currency settlement capabilities.',
        formId: 'form-acme-001',
        status: WORKFLOW_STATUSES.DRAFT,
        priority: 'medium',
        metadata: {
          accountType: 'Global Custody',
          estimatedAssets: '$50M',
          jurisdiction: 'Delaware, USA'
        }
      },

      // 2. Submitted form (waiting for GCS review)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Investment Account Opening - TechStart LLC',
        description: 'Technology startup requiring custody services for employee stock options and treasury management.',
        formId: 'form-techstart-001',
        status: WORKFLOW_STATUSES.SUBMITTED,
        priority: 'high',
        currentAssignee: gcs.id,
        metadata: {
          accountType: 'Cash & Securities',
          estimatedAssets: '$10M',
          jurisdiction: 'California, USA'
        }
      },

      // 3. Under GCS review
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Pension Fund Custody - RetireSafe Fund',
        description: 'Large pension fund requiring comprehensive custody services across global markets.',
        formId: 'form-retiresafe-001',
        status: WORKFLOW_STATUSES.UNDER_GCS_REVIEW,
        priority: 'urgent',
        currentAssignee: gcs.id,
        metadata: {
          accountType: 'Global Custody',
          estimatedAssets: '$500M',
          jurisdiction: 'New York, USA'
        }
      },

      // 4. GCS rejected (needs client attention)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Hedge Fund Setup - Alpha Strategies',
        description: 'Hedge fund requiring prime brokerage and custody services for alternative investments.',
        formId: 'form-alpha-001',
        status: WORKFLOW_STATUSES.GCS_REJECTED,
        priority: 'medium',
        metadata: {
          accountType: 'Prime Brokerage',
          estimatedAssets: '$25M',
          jurisdiction: 'Cayman Islands'
        }
      },

      // 5. Escalated to BBH (complex case)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'International Bank Subsidiary - EuroBank USA',
        description: 'Complex multinational banking subsidiary requiring specialized custody arrangements.',
        formId: 'form-eurobank-001',
        status: WORKFLOW_STATUSES.ESCALATED_TO_BBH,
        priority: 'urgent',
        currentAssignee: bbh.id,
        metadata: {
          accountType: 'Institutional Banking',
          estimatedAssets: '$2B',
          jurisdiction: 'Multiple (USA, EU, UK)'
        }
      },

      // 6. BBH Review (awaiting final approval)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Sovereign Wealth Fund - Nordic Investment',
        description: 'Government investment fund requiring highest level of custody and compliance oversight.',
        formId: 'form-nordic-001',
        status: WORKFLOW_STATUSES.BBH_REVIEW,
        priority: 'urgent',
        currentAssignee: bbh.id,
        metadata: {
          accountType: 'Sovereign Entity',
          estimatedAssets: '$5B',
          jurisdiction: 'Norway'
        }
      },

      // 7. BBH Approved (complex case approved)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Insurance Company - SecureLife Assurance',
        description: 'Insurance company custody account for managing policyholder reserves and investments.',
        formId: 'form-securelife-001',
        status: WORKFLOW_STATUSES.BBH_APPROVED,
        priority: 'high',
        completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        metadata: {
          accountType: 'Insurance Custody',
          estimatedAssets: '$100M',
          jurisdiction: 'Connecticut, USA'
        }
      },

      // 8. Completed (simple case)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Small Business Account - Local Bakery Chain',
        description: 'Regional bakery chain requiring basic cash management and custody services.',
        formId: 'form-bakery-001',
        status: WORKFLOW_STATUSES.COMPLETED,
        priority: 'low',
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        metadata: {
          accountType: 'Small Business',
          estimatedAssets: '$2M',
          jurisdiction: 'Texas, USA'
        }
      },

      // 9. BBH Rejected (complex case rejected)
      {
        tenantId: tenant.id,
        clientId: client.id,
        title: 'Cryptocurrency Exchange - CryptoTrade Inc',
        description: 'Digital asset exchange requiring custody services for cryptocurrency holdings.',
        formId: 'form-cryptotrade-001',
        status: WORKFLOW_STATUSES.BBH_REJECTED,
        priority: 'medium',
        completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        metadata: {
          accountType: 'Digital Assets',
          estimatedAssets: '$15M',
          jurisdiction: 'Malta'
        }
      }
    ];

    // Create workflows with history and comments
    sampleWorkflows.forEach((workflowData, index) => {
      const workflow = new Workflow({
        ...workflowData,
        createdDate: new Date(Date.now() - (10 - index) * 24 * 60 * 60 * 1000).toISOString() // Stagger creation dates
      });

      // Add creation history
      workflow.addHistoryEntry('Form created', client.id);

      // Add appropriate comments and history based on status
      switch (workflow.status) {
        case WORKFLOW_STATUSES.DRAFT:
          workflow.addComment(client.id, 'Still working on gathering all required documentation for the account opening.');
          break;

        case WORKFLOW_STATUSES.SUBMITTED:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Form completed and submitted for review. All required documents have been attached.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          break;

        case WORKFLOW_STATUSES.UNDER_GCS_REVIEW:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'High priority account opening. Client has requested expedited processing.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.addComment(gcs.id, 'Reviewing documentation. May need additional KYC information.', true);
          break;

        case WORKFLOW_STATUSES.GCS_REJECTED:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Completed form with all required fields.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.updateStatus(WORKFLOW_STATUSES.GCS_REJECTED, gcs.id, 'Missing required regulatory documentation for Cayman Islands jurisdiction. Please provide Certificate of Good Standing and updated Board Resolutions.');
          break;

        case WORKFLOW_STATUSES.ESCALATED_TO_BBH:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Complex multinational structure requiring specialized review.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.updateStatus(WORKFLOW_STATUSES.ESCALATED_TO_BBH, gcs.id, 'Complex regulatory requirements across multiple jurisdictions. Requires BBH Client Service review for compliance approval.');
          workflow.updateStatus(WORKFLOW_STATUSES.BBH_REVIEW, bbh.id);
          break;

        case WORKFLOW_STATUSES.BBH_REVIEW:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Government entity with special regulatory requirements.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.updateStatus(WORKFLOW_STATUSES.ESCALATED_TO_BBH, gcs.id, 'Sovereign wealth fund requires senior management approval and enhanced due diligence.');
          workflow.updateStatus(WORKFLOW_STATUSES.BBH_REVIEW, bbh.id);
          workflow.addComment(bbh.id, 'Coordinating with compliance team for enhanced due diligence procedures.', true);
          break;

        case WORKFLOW_STATUSES.BBH_APPROVED:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Insurance company account setup with comprehensive requirements.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.updateStatus(WORKFLOW_STATUSES.ESCALATED_TO_BBH, gcs.id, 'Insurance regulatory requirements need senior review.');
          workflow.updateStatus(WORKFLOW_STATUSES.BBH_REVIEW, bbh.id);
          workflow.updateStatus(WORKFLOW_STATUSES.BBH_APPROVED, bbh.id, 'Approved after compliance review. Account setup can proceed with standard insurance custody procedures.');
          break;

        case WORKFLOW_STATUSES.COMPLETED:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Straightforward business account with standard requirements.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.updateStatus(WORKFLOW_STATUSES.COMPLETED, gcs.id, 'Standard business account approved. All documentation verified and account ready for activation.');
          break;

        case WORKFLOW_STATUSES.BBH_REJECTED:
          workflow.updateStatus(WORKFLOW_STATUSES.SUBMITTED, client.id, 'Cryptocurrency exchange custody services requested.');
          workflow.updateStatus(WORKFLOW_STATUSES.UNDER_GCS_REVIEW, gcs.id);
          workflow.updateStatus(WORKFLOW_STATUSES.ESCALATED_TO_BBH, gcs.id, 'Digital asset custody requires specialized approval due to regulatory complexity.');
          workflow.updateStatus(WORKFLOW_STATUSES.BBH_REVIEW, bbh.id);
          workflow.updateStatus(WORKFLOW_STATUSES.BBH_REJECTED, bbh.id, 'Unable to provide custody services for cryptocurrency assets at this time due to current regulatory framework limitations.');
          break;
      }

      // Add some additional realistic comments
      if ([WORKFLOW_STATUSES.UNDER_GCS_REVIEW, WORKFLOW_STATUSES.BBH_REVIEW].includes(workflow.status)) {
        workflow.addComment(client.id, 'Please let me know if you need any additional information or documentation.');
      }

      if (workflow.status === WORKFLOW_STATUSES.GCS_REJECTED) {
        workflow.addComment(client.id, 'Working on obtaining the requested documentation. Will resubmit within 3 business days.');
      }

      workflow.save();
      console.log(`Created sample workflow: ${workflow.title} (${workflow.status})`);
    });

    console.log(`✅ Created ${sampleWorkflows.length} sample workflows for ${tenant.name}`);
  });

  console.log('🎉 Sample data creation completed!');
}

module.exports = { createSampleData };