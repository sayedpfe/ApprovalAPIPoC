const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');

/**
 * GET /api/approvals
 * Get all approval items
 */
router.get('/', async (req, res) => {
  try {
    const approvals = await graphService.getApprovals();
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch approvals', 
      message: error.message 
    });
  }
});

/**
 * GET /api/approvals/:id
 * Get a specific approval item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const approval = await graphService.getApprovalById(req.params.id);
    res.json(approval);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch approval', 
      message: error.message 
    });
  }
});

/**
 * POST /api/approvals
 * Create a new approval request
 * Body example:
 * {
 *   "displayName": "Purchase Request",
 *   "description": "Request approval for office supplies",
 *   "approvers": [{"user": {"id": "user-id"}}],
 *   "owner": {"user": {"id": "owner-id"}}
 * }
 */
router.post('/', async (req, res) => {
  try {
    const approvalData = req.body;
    const result = await graphService.createApproval(approvalData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create approval', 
      message: error.message 
    });
  }
});

/**
 * POST /api/approvals/:id/respond
 * Respond to an approval request (approve/reject)
 * Body example:
 * {
 *   "response": "approved", // or "rejected"
 *   "comments": "Looks good to me"
 * }
 */
router.post('/:id/respond', async (req, res) => {
  try {
    const { response, comments } = req.body;
    const responseData = {
      response,
      comments
    };
    const result = await graphService.respondToApproval(req.params.id, responseData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to respond to approval', 
      message: error.message 
    });
  }
});

/**
 * POST /api/approvals/:id/cancel
 * Cancel an approval request
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const result = await graphService.cancelApproval(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to cancel approval', 
      message: error.message 
    });
  }
});

/**
 * GET /api/approvals/:id/responses
 * Get all responses for a specific approval
 */
router.get('/:id/responses', async (req, res) => {
  try {
    const responses = await graphService.getApprovalResponses(req.params.id);
    res.json(responses);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch approval responses', 
      message: error.message 
    });
  }
});

module.exports = router;
