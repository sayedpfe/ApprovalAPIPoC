const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

class GraphService {
  constructor() {
    const credential = new ClientSecretCredential(
      process.env.TENANT_ID,
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: [process.env.GRAPH_API_SCOPE || 'https://graph.microsoft.com/.default']
    });

    this.client = Client.initWithMiddleware({ authProvider });
  }

  /**
   * Get all approval items for the authenticated user
   */
  async getApprovals() {
    try {
      const response = await this.client
        .api('/solutions/approval/approvalItems')
        .get();
      return response;
    } catch (error) {
      console.error('Error fetching approvals:', error);
      throw error;
    }
  }

  /**
   * Get a specific approval item by ID
   */
  async getApprovalById(approvalId) {
    try {
      const response = await this.client
        .api(`/solutions/approval/approvalItems/${approvalId}`)
        .get();
      return response;
    } catch (error) {
      console.error(`Error fetching approval ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new approval request
   */
  async createApproval(approvalData) {
    try {
      const response = await this.client
        .api('/solutions/approval/approvalItems')
        .post(approvalData);
      return response;
    } catch (error) {
      console.error('Error creating approval:', error);
      throw error;
    }
  }

  /**
   * Respond to an approval request (approve/reject)
   */
  async respondToApproval(approvalId, response) {
    try {
      const result = await this.client
        .api(`/solutions/approval/approvalItems/${approvalId}/responses`)
        .post(response);
      return result;
    } catch (error) {
      console.error(`Error responding to approval ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApproval(approvalId) {
    try {
      const result = await this.client
        .api(`/solutions/approval/approvalItems/${approvalId}/cancel`)
        .post({});
      return result;
    } catch (error) {
      console.error(`Error canceling approval ${approvalId}:`, error);
      throw error;
    }
  }

  /**
   * Get approval responses for a specific approval
   */
  async getApprovalResponses(approvalId) {
    try {
      const response = await this.client
        .api(`/solutions/approval/approvalItems/${approvalId}/responses`)
        .get();
      return response;
    } catch (error) {
      console.error(`Error fetching approval responses for ${approvalId}:`, error);
      throw error;
    }
  }
}

module.exports = new GraphService();
