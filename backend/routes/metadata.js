const express = require('express');
const router = express.Router();
const cosmosDbService = require('../services/cosmosDbService');
const oneDriveService = require('../services/oneDriveService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    cb(null, true);
  }
});

/**
 * POST /api/metadata
 * Save approval metadata to Cosmos DB
 */
router.post('/', async (req, res) => {
  try {
    const { approvalId, metadata } = req.body;

    if (!approvalId) {
      return res.status(400).json({ error: 'approvalId is required' });
    }

    const result = await cosmosDbService.saveMetadata(approvalId, metadata);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error saving metadata:', error);
    res.status(500).json({
      error: 'Failed to save metadata',
      message: error.message
    });
  }
});

/**
 * GET /api/metadata/:approvalId
 * Get metadata for a specific approval
 */
router.get('/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const metadata = await cosmosDbService.getMetadata(approvalId);

    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({
      error: 'Failed to get metadata',
      message: error.message
    });
  }
});

/**
 * GET /api/metadata
 * Get all metadata (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.creatorEmail) {
      filters.creatorEmail = req.query.creatorEmail;
    }

    const metadata = await cosmosDbService.getAllMetadata(filters);
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Error getting all metadata:', error);
    res.status(500).json({
      error: 'Failed to get metadata',
      message: error.message
    });
  }
});

/**
 * DELETE /api/metadata/:approvalId
 * Delete metadata for an approval
 */
router.delete('/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const result = await cosmosDbService.deleteMetadata(approvalId);

    if (!result) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    res.json({
      success: true,
      message: 'Metadata deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting metadata:', error);
    res.status(500).json({
      error: 'Failed to delete metadata',
      message: error.message
    });
  }
});

/**
 * PATCH /api/metadata/:approvalId
 * Update specific fields in metadata
 */
router.patch('/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const updates = req.body;

    const result = await cosmosDbService.updateMetadataFields(approvalId, updates);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({
      error: 'Failed to update metadata',
      message: error.message
    });
  }
});

/**
 * POST /api/metadata/:approvalId/attachments
 * Upload files to OneDrive and save metadata
 */
router.post('/:approvalId/attachments', upload.array('files', 10), async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { accessToken, approverEmails } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Parse approver emails (sent as JSON string)
    const emails = JSON.parse(approverEmails || '[]');

    // Upload files to OneDrive and share with approvers
    const uploadedFiles = await oneDriveService.uploadAndShareFiles(
      accessToken,
      req.files,
      emails,
      approvalId
    );

    // Get existing metadata
    let metadata = await cosmosDbService.getMetadata(approvalId);
    if (!metadata) {
      metadata = { attachments: [] };
    }

    // Add uploaded files to attachments
    const existingAttachments = metadata.attachments || [];
    const newAttachments = uploadedFiles.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      webUrl: file.webUrl,
      downloadUrl: file.downloadUrl,
      sharingLink: file.sharingLink,
      uploadedAt: new Date().toISOString()
    }));

    metadata.attachments = [...existingAttachments, ...newAttachments];

    // Save updated metadata
    const result = await cosmosDbService.saveMetadata(approvalId, metadata);

    res.json({
      success: true,
      data: {
        metadata: result,
        uploadedFiles
      }
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({
      error: 'Failed to upload attachments',
      message: error.message
    });
  }
});

module.exports = router;
