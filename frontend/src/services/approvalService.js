import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApprovalService {
  /**
   * Get all approval items
   */
  async getApprovals() {
    try {
      const response = await axios.get(`${API_URL}/approvals`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approvals:', error);
      throw error;
    }
  }

  /**
   * Get a specific approval by ID
   */
  async getApprovalById(id) {
    try {
      const response = await axios.get(`${API_URL}/approvals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approval:', error);
      throw error;
    }
  }

  /**
   * Create a new approval request
   */
  async createApproval(approvalData) {
    try {
      const response = await axios.post(`${API_URL}/approvals`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error creating approval:', error);
      throw error;
    }
  }

  /**
   * Respond to an approval (approve/reject)
   */
  async respondToApproval(id, response, comments) {
    try {
      const result = await axios.post(`${API_URL}/approvals/${id}/respond`, {
        response,
        comments
      });
      return result.data;
    } catch (error) {
      console.error('Error responding to approval:', error);
      throw error;
    }
  }

  /**
   * Cancel an approval request
   */
  async cancelApproval(id) {
    try {
      const response = await axios.post(`${API_URL}/approvals/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling approval:', error);
      throw error;
    }
  }

  /**
   * Get responses for a specific approval
   */
  async getApprovalResponses(id) {
    try {
      const response = await axios.get(`${API_URL}/approvals/${id}/responses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approval responses:', error);
      throw error;
    }
  }
}

export default new ApprovalService();
