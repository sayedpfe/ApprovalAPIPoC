/**
 * Service for managing custom approval metadata
 * Stores data not supported by Microsoft Graph API:
 * - Attachments
 * - Due dates
 * - Sequential ordering information
 */

const METADATA_STORAGE_KEY = 'approval_metadata';

class ApprovalMetadataService {
  /**
   * Save custom metadata for an approval
   */
  saveMetadata(approvalId, metadata) {
    const allMetadata = this.getAllMetadata();
    allMetadata[approvalId] = {
      ...metadata,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(allMetadata));
  }

  /**
   * Get metadata for a specific approval
   */
  getMetadata(approvalId) {
    const allMetadata = this.getAllMetadata();
    return allMetadata[approvalId] || null;
  }

  /**
   * Get all metadata
   */
  getAllMetadata() {
    const data = localStorage.getItem(METADATA_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  /**
   * Delete metadata for an approval
   */
  deleteMetadata(approvalId) {
    const allMetadata = this.getAllMetadata();
    delete allMetadata[approvalId];
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(allMetadata));
  }

  /**
   * Clear all metadata
   */
  clearAllMetadata() {
    localStorage.removeItem(METADATA_STORAGE_KEY);
  }
}

export default new ApprovalMetadataService();
