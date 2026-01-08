import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

class ApprovalMetadataService {
  /**
   * Save metadata to Cosmos DB via backend
   */
  async saveMetadata(approvalId, metadata, accessToken) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/metadata`, {
        approvalId,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString()
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  /**
   * Get metadata from Cosmos DB
   */
  async getMetadata(approvalId, accessToken) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metadata/${approvalId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No metadata found
      }
      console.error('Error getting metadata:', error);
      throw error;
    }
  }

  /**
   * Get all metadata (with optional filters)
   */
  async getAllMetadata(filters = {}, accessToken) {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${API_BASE_URL}/api/metadata?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting all metadata:', error);
      throw error;
    }
  }

  /**
   * Delete metadata from Cosmos DB
   */
  async deleteMetadata(approvalId, accessToken) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/metadata/${approvalId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting metadata:', error);
      throw error;
    }
  }

  /**
   * Update specific fields in metadata
   */
  async updateMetadataFields(approvalId, updates, accessToken) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/api/metadata/${approvalId}`, updates, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  /**
   * Upload files to OneDrive and save metadata
   * Files are uploaded to creator's OneDrive and shared with approvers
   */
  async uploadAttachments(approvalId, files, approverEmails, accessToken) {
    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add access token and approver emails
      formData.append('accessToken', accessToken);
      formData.append('approverEmails', JSON.stringify(approverEmails));

      const response = await axios.post(
        `${API_BASE_URL}/api/metadata/${approvalId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error uploading attachments:', error);
      throw error;
    }
  }

  /**
   * Legacy method - for backward compatibility with localStorage
   * This can be removed once all code is migrated to use the backend
   */
  saveMetadataLocally(approvalId, metadata) {
    try {
      const allMetadata = JSON.parse(localStorage.getItem('approvalMetadata') || '{}');
      allMetadata[approvalId] = {
        ...metadata,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('approvalMetadata', JSON.stringify(allMetadata));
      return allMetadata[approvalId];
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return null;
    }
  }

  /**
   * Legacy method - get from localStorage
   */
  getMetadataLocally(approvalId) {
    try {
      const allMetadata = JSON.parse(localStorage.getItem('approvalMetadata') || '{}');
      return allMetadata[approvalId] || null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
}

export default new ApprovalMetadataService();
