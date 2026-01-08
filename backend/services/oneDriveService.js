const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class OneDriveService {
  /**
   * Upload a file to the creator's OneDrive
   * @param {string} accessToken - User's Microsoft Graph access token
   * @param {Object} file - File object from multer
   * @param {string} folderPath - Optional folder path in OneDrive (default: /Approvals)
   * @returns {Object} File metadata with sharing link
   */
  async uploadFile(accessToken, file, folderPath = '/Approvals') {
    try {
      const fileName = file.originalname;
      const filePath = `${folderPath}/${fileName}`;
      const fileBuffer = fs.readFileSync(file.path);

      // Upload file to OneDrive
      const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/content`;
      
      console.log(`Uploading file to OneDrive: ${filePath}`);
      const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': file.mimetype
        }
      });

      const fileId = uploadResponse.data.id;
      console.log(`File uploaded successfully. File ID: ${fileId}`);

      // Clean up temporary file
      fs.unlinkSync(file.path);

      return {
        id: fileId,
        name: uploadResponse.data.name,
        size: uploadResponse.data.size,
        webUrl: uploadResponse.data.webUrl,
        downloadUrl: uploadResponse.data['@microsoft.graph.downloadUrl'],
        createdDateTime: uploadResponse.data.createdDateTime
      };
    } catch (error) {
      console.error('Error uploading file to OneDrive:', error.response?.data || error.message);
      throw new Error('Failed to upload file to OneDrive: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Create a sharing link for a file and share with specific users
   * @param {string} accessToken - User's Microsoft Graph access token
   * @param {string} fileId - OneDrive file ID
   * @param {Array<string>} emails - Array of approver email addresses
   * @returns {Object} Sharing information
   */
  async shareFileWithApprovers(accessToken, fileId, emails) {
    try {
      console.log(`Creating sharing link for file: ${fileId}`);
      
      // Create a sharing link that allows viewing
      const sharingLinkUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/createLink`;
      const sharingLinkResponse = await axios.post(sharingLinkUrl, {
        type: 'view',
        scope: 'organization'
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const sharingLink = sharingLinkResponse.data.link.webUrl;
      console.log(`Sharing link created: ${sharingLink}`);

      // Grant specific permissions to each approver
      const permissions = [];
      for (const email of emails) {
        try {
          const permissionUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/invite`;
          const permissionResponse = await axios.post(permissionUrl, {
            recipients: [{ email }],
            message: 'This file is attached to an approval request that requires your review.',
            requireSignIn: true,
            sendInvitation: true,
            roles: ['read']
          }, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          permissions.push({
            email,
            permissionId: permissionResponse.data.value?.[0]?.id,
            status: 'granted'
          });
          console.log(`Permission granted to: ${email}`);
        } catch (error) {
          console.error(`Error granting permission to ${email}:`, error.response?.data || error.message);
          permissions.push({
            email,
            status: 'failed',
            error: error.response?.data?.error?.message || error.message
          });
        }
      }

      return {
        sharingLink,
        permissions
      };
    } catch (error) {
      console.error('Error sharing file:', error.response?.data || error.message);
      throw new Error('Failed to share file: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Upload multiple files and share with approvers
   * @param {string} accessToken - User's Microsoft Graph access token
   * @param {Array} files - Array of file objects from multer
   * @param {Array<string>} approverEmails - Array of approver email addresses
   * @param {string} approvalId - Approval ID for organizing files
   * @returns {Array} Array of uploaded file metadata with sharing info
   */
  async uploadAndShareFiles(accessToken, files, approverEmails, approvalId) {
    try {
      const folderPath = `/Approvals/${approvalId}`;
      const uploadedFiles = [];

      for (const file of files) {
        try {
          // Upload file
          const fileMetadata = await this.uploadFile(accessToken, file, folderPath);

          // Share with approvers
          const sharingInfo = await this.shareFileWithApprovers(
            accessToken, 
            fileMetadata.id, 
            approverEmails
          );

          uploadedFiles.push({
            ...fileMetadata,
            sharingLink: sharingInfo.sharingLink,
            sharedWith: sharingInfo.permissions
          });
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error.message);
          uploadedFiles.push({
            name: file.originalname,
            error: error.message,
            status: 'failed'
          });
        }
      }

      return uploadedFiles;
    } catch (error) {
      console.error('Error in uploadAndShareFiles:', error);
      throw error;
    }
  }

  /**
   * Delete a file from OneDrive
   * @param {string} accessToken - User's Microsoft Graph access token
   * @param {string} fileId - OneDrive file ID
   */
  async deleteFile(accessToken, fileId) {
    try {
      const deleteUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`;
      await axios.delete(deleteUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log(`File deleted: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error.response?.data || error.message);
      throw new Error('Failed to delete file: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  /**
   * Get file metadata from OneDrive
   * @param {string} accessToken - User's Microsoft Graph access token
   * @param {string} fileId - OneDrive file ID
   */
  async getFileMetadata(accessToken, fileId) {
    try {
      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error.response?.data || error.message);
      throw new Error('Failed to get file metadata: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}

module.exports = new OneDriveService();
