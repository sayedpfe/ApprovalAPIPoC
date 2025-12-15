import axios from 'axios';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/beta/solutions/approval';

// Helper function to get auth token from MSAL
const getAuthHeaders = async (msalInstance, accounts) => {
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please sign in.');
  }

  const request = {
    scopes: ['ApprovalSolution.ReadWrite', 'ApprovalSolutionResponse.ReadWrite'],
    account: accounts[0],
  };

  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return {
      'Authorization': `Bearer ${response.accessToken}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    // If silent token acquisition fails, try interactive
    const response = await msalInstance.acquireTokenPopup(request);
    return {
      'Authorization': `Bearer ${response.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
};

class ApprovalService {
  /**
   * Get approval items for the current user
   * The API returns approvals based on the authenticated user's permissions
   */
  async getApprovals(msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      // The Approvals API with delegated permissions returns approvals
      // where the authenticated user is either an approver or owner
      const response = await axios.get(`${GRAPH_BASE_URL}/approvalItems`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching approvals:', error);
      throw error;
    }
  }

  /**
   * Get a specific approval by ID
   */
  async getApprovalById(id, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const response = await axios.get(`${GRAPH_BASE_URL}/approvalItems/${id}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching approval:', error);
      throw error;
    }
  }

  /**
   * Create a new approval request
   */
  async createApproval(approvalData, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const response = await axios.post(`${GRAPH_BASE_URL}/approvalItems`, approvalData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating approval:', error);
      throw error;
    }
  }

  /**
   * Respond to an approval (approve/reject)
   */
  async respondToApproval(id, responseData, comments, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const result = await axios.post(
        `${GRAPH_BASE_URL}/approvalItems/${id}/responses`,
        { response: responseData, comments },
        { headers }
      );
      return result.data;
    } catch (error) {
      console.error('Error responding to approval:', error);
      throw error;
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApproval(id, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const response = await axios.post(`${GRAPH_BASE_URL}/approvalItems/${id}/cancel`, {}, { headers });
      return response.data;
    } catch (error) {
      console.error('Error canceling approval:', error);
      throw error;
    }
  }

  /**
   * Get responses for a specific approval
   */
  async getApprovalResponses(id, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const response = await axios.get(`${GRAPH_BASE_URL}/approvalItems/${id}/responses`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching approval responses:', error);
      throw error;
    }
  }
}

export default new ApprovalService();
