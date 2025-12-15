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
      console.log('Creating approval with payload:', JSON.stringify(approvalData, null, 2));
      const response = await axios.post(`${GRAPH_BASE_URL}/approvalItems`, approvalData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating approval:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        if (error.response.data.error) {
          console.error('Error code:', error.response.data.error.code);
          console.error('Error message:', error.response.data.error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Respond to an approval request (approve/reject)
   * This responds to a specific request within an approval item
   * Uses PATCH method to update the request
   */
  async respondToApprovalRequest(approvalItemId, requestId, responseData, comments, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const payload = { 
        response: responseData,
        comments: comments
      };
      
      console.log('Responding to approval request with payload:', JSON.stringify(payload, null, 2));
      console.log('Approval Item ID:', approvalItemId);
      console.log('Request ID:', requestId);
      console.log('URL:', `${GRAPH_BASE_URL}/approvalItems/${approvalItemId}/requests/${requestId}`);
      
      // Try PATCH method to update the request
      const result = await axios.patch(
        `${GRAPH_BASE_URL}/approvalItems/${approvalItemId}/requests/${requestId}`,
        payload,
        { headers }
      );
      
      console.log('Response submitted successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error responding to approval request:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        if (error.response.data.error) {
          console.error('Error code:', error.response.data.error.code);
          console.error('Error message:', error.response.data.error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Legacy method - Respond to an approval (approve/reject) via responses endpoint
   * Note: This may not work for all approval types
   */
  async respondToApproval(id, responseData, comments, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const payload = { response: responseData, comments };
      
      console.log('Responding to approval with payload:', JSON.stringify(payload, null, 2));
      console.log('URL:', `${GRAPH_BASE_URL}/approvalItems/${id}/responses`);
      
      const result = await axios.post(
        `${GRAPH_BASE_URL}/approvalItems/${id}/responses`,
        payload,
        { headers }
      );
      
      console.log('Response submitted successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error responding to approval:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        if (error.response.data.error) {
          console.error('Error code:', error.response.data.error.code);
          console.error('Error message:', error.response.data.error.message);
        }
      }
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
   * Get approval requests for a specific approval item
   */
  async getApprovalRequests(id, msalInstance, accounts) {
    try {
      const headers = await getAuthHeaders(msalInstance, accounts);
      const response = await axios.get(`${GRAPH_BASE_URL}/approvalItems/${id}/requests`, { headers });
      console.log('Approval requests:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching approval requests:', error);
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
