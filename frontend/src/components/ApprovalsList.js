import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import approvalService from '../services/approvalService';

function ApprovalsList() {
  const { instance, accounts } = useMsal();
  const [approverPendingApprovals, setApproverPendingApprovals] = useState([]);
  const [approverCompletedApprovals, setApproverCompletedApprovals] = useState([]);
  const [ownerPendingApprovals, setOwnerPendingApprovals] = useState([]);
  const [ownerCompletedApprovals, setOwnerCompletedApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('approver-pending'); // 'approver-pending', 'approver-completed', 'owner-pending', 'owner-completed'

  useEffect(() => {
    if (accounts.length > 0) {
      loadApprovals();
    }
  }, [accounts]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      
      // First, get the current user's Object ID from Microsoft Graph
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        }
      });
      const currentUser = await userResponse.json();
      const currentUserObjectId = currentUser.id?.toLowerCase();
      
      console.log('=== Current User Info ===');
      console.log('Object ID from Graph:', currentUserObjectId);
      console.log('Email:', currentUser.mail || currentUser.userPrincipalName);
      console.log('Display Name:', currentUser.displayName);
      
      // Now get approvals
      const data = await approvalService.getApprovals(instance, accounts);
      const allApprovals = data.value || [];
      
      console.log('=== All Approvals ===');
      console.log('Total approvals:', allApprovals.length);
      const approverPending = [];
      const approverCompleted = [];
      const ownerPending = [];
      const ownerCompleted = [];
      
      allApprovals.forEach((approval, index) => {
        console.log(`\n--- Approval ${index + 1}: ${approval.displayName} ---`);
        
        // Check if user is in the approvers list
        const isApprover = approval.approvers?.some(approver => {
          const approverId = approver.user?.id?.toLowerCase();
          console.log(`  Checking approver ID: ${approverId} === ${currentUserObjectId}?`);
          return approverId === currentUserObjectId;
        });
        
        // Check if user is the owner
        const ownerId = approval.owner?.user?.id?.toLowerCase();
        const isOwner = ownerId === currentUserObjectId;
        
        // Determine if completed (state is 'completed' or result is not 'pending')
        const isCompleted = approval.state === 'completed' || 
                          (approval.result && approval.result !== 'pending');
        
        console.log(`  Is Approver? ${isApprover}, Is Owner? ${isOwner}, Is Completed? ${isCompleted}`);
        console.log(`  State: ${approval.state}, Result: ${approval.result}`);
        
        // Add to appropriate lists
        if (isApprover && !isOwner) {
          if (isCompleted) {
            approverCompleted.push(approval);
          } else {
            approverPending.push(approval);
          }
        }
        if (isOwner) {
          if (isCompleted) {
            ownerCompleted.push(approval);
          } else {
            ownerPending.push(approval);
          }
        }
      });
      
      console.log('=== Filtered Results ===');
      console.log('Approver Pending:', approverPending.length);
      console.log('Approver Completed:', approverCompleted.length);
      console.log('Owner Pending:', ownerPending.length);
      console.log('Owner Completed:', ownerCompleted.length);
      
      setApproverPendingApprovals(approverPending);
      setApproverCompletedApprovals(approverCompleted);
      setOwnerPendingApprovals(ownerPending);
      setOwnerCompletedApprovals(ownerCompleted);
      setError(null);
    } catch (err) {
      console.error('Error loading approvals:', err);
      setError('Failed to load approvals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (approvalId, response) => {
    console.log('==============================================');
    console.log(`=== BUTTON CLICKED - Responding to Approval ===`);
    console.log('==============================================');
    console.log('Approval ID:', approvalId);
    console.log('Response:', response);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      // First, get the approval requests to find the request ID for the current user
      const requestsData = await approvalService.getApprovalRequests(approvalId, instance, accounts);
      const requests = requestsData.value || [];
      
      console.log('Found requests:', requests.length);
      console.log('All requests:', JSON.stringify(requests, null, 2));
      
      if (requests.length === 0) {
        throw new Error('No approval requests found for this approval item');
      }
      
      // Get current user ID
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: accounts[0]
      });
      
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        }
      });
      const currentUser = await userResponse.json();
      const currentUserObjectId = currentUser.id?.toLowerCase();
      
      console.log('Current user ID:', currentUserObjectId);
      
      // Find the request assigned to the current user
      const myRequest = requests.find(req => 
        req.approver?.user?.id?.toLowerCase() === currentUserObjectId
      );
      
      if (!myRequest) {
        console.error('Could not find request for current user');
        console.error('Available requests:', requests.map(r => ({
          id: r.id,
          approverId: r.approver?.user?.id,
          status: r.status
        })));
        throw new Error('No approval request found for the current user. You may not be assigned as an approver.');
      }
      
      console.log('My request ID:', myRequest.id);
      console.log('Request object:', JSON.stringify(myRequest, null, 2));
      console.log('Request status:', myRequest.status);
      console.log('Request isCompleted:', myRequest.isCompleted);
      
      // Check if already responded (handle various status field names)
      const status = myRequest.status || myRequest.state;
      const isCompleted = myRequest.isCompleted === true;
      
      if (isCompleted || (status && status !== 'pending' && status !== 'notStarted' && status !== 'inProgress')) {
        throw new Error(`This request has already been completed. Status: ${status || 'completed'}`);
      }
      
      // Respond using the simpler responses endpoint (doesn't require request ID)
      console.log('Attempting to respond to approval item directly...');
      console.log('Calling approvalService.respondToApproval...');
      
      const result = await approvalService.respondToApproval(
        approvalId,
        response, 
        'Response from PoC', 
        instance, 
        accounts
      );
      
      console.log('SUCCESS! Response result:', result);
      console.log('==============================================');
      
      // Wait a moment for the API to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the updated approval to see the new state
      console.log('Fetching updated approval item...');
      const updatedApproval = await approvalService.getApprovalById(approvalId, instance, accounts);
      console.log('Updated approval state:', updatedApproval.state);
      console.log('Updated approval result:', updatedApproval.result);
      console.log('Updated approval completedDateTime:', updatedApproval.completedDateTime);
      console.log('Full updated approval:', JSON.stringify(updatedApproval, null, 2));
      
      alert(`Successfully ${response === 'Approve' ? 'approved' : 'rejected'} the request!`);
      
      // Reload approvals to show updated state
      loadApprovals();
    } catch (err) {
      console.error('Error responding to approval:', err);
      alert('Failed to respond: ' + err.message);
    }
  };

  const handleCancel = async (approvalId, approvalName) => {
    const confirmed = window.confirm(`Are you sure you want to cancel the approval request: "${approvalName}"?`);
    if (!confirmed) return;

    console.log('==============================================');
    console.log('=== CANCELING APPROVAL REQUEST ===');
    console.log('==============================================');
    console.log('Approval ID:', approvalId);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      await approvalService.cancelApproval(approvalId, instance, accounts);
      console.log('Approval canceled successfully');
      alert('Approval request canceled successfully!');
      
      // Reload approvals to show updated list
      loadApprovals();
    } catch (err) {
      console.error('Error canceling approval:', err);
      alert('Failed to cancel approval: ' + err.message);
    }
  };

  // Determine which approvals to show based on active tab
  let currentApprovals = [];
  let emptyMessage = '';
  let showActions = false;
  let showCancelButton = false;

  switch(activeTab) {
    case 'approver-pending':
      currentApprovals = approverPendingApprovals;
      emptyMessage = 'No approvals pending your response.';
      showActions = true;
      showCancelButton = false;
      break;
    case 'approver-completed':
      currentApprovals = approverCompletedApprovals;
      emptyMessage = 'No completed approvals.';
      showActions = false;
      showCancelButton = false;
      break;
    case 'owner-pending':
      currentApprovals = ownerPendingApprovals;
      emptyMessage = 'No pending requests that you created.';
      showActions = false;
      showCancelButton = true;
      break;
    case 'owner-completed':
      currentApprovals = ownerCompletedApprovals;
      emptyMessage = 'No completed requests that you created.';
      showActions = false;
      showCancelButton = false;
      break;
    default:
      currentApprovals = approverPendingApprovals;
      showCancelButton = false;
  }

  return (
    <div style={styles.container}>
      <h2>My Approval Requests</h2>
      
      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('approver-pending')}
          style={activeTab === 'approver-pending' ? styles.activeTab : styles.tab}
        >
          Pending My Approval ({approverPendingApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('approver-completed')}
          style={activeTab === 'approver-completed' ? styles.activeTab : styles.tab}
        >
          My Completed ({approverCompletedApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('owner-pending')}
          style={activeTab === 'owner-pending' ? styles.activeTab : styles.tab}
        >
          Pending Requests ({ownerPendingApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('owner-completed')}
          style={activeTab === 'owner-completed' ? styles.activeTab : styles.tab}
        >
          Completed Requests ({ownerCompletedApprovals.length})
        </button>
      </div>

      {/* Content based on active tab */}
      {currentApprovals.length === 0 ? (
        <p style={styles.emptyMessage}>{emptyMessage}
        </p>
      ) : (
        <div style={styles.list}>
          {currentApprovals.map((approval) => (
            <div key={approval.id} style={styles.card}>
              <h3>{approval.displayName || 'Untitled Approval'}</h3>
              <p><strong>Status:</strong> {approval.state || 'Unknown'}</p>
              <p><strong>Result:</strong> {approval.result || 'Pending'}</p>
              <p><strong>Created:</strong> {new Date(approval.createdDateTime).toLocaleString()}</p>
              {approval.description && <p>{approval.description}</p>}
              <p><strong>Approval Type:</strong> {approval.approvalType === 'basic' ? 'Any Approver' : 'All Approvers Must Approve'}</p>
              
              {/* Show action buttons only for pending approver tab */}
              {showActions && (
                <div style={styles.actions}>
                  <button 
                    onClick={() => handleRespond(approval.id, 'Approve')}
                    style={styles.approveButton}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRespond(approval.id, 'Reject')}
                    style={styles.rejectButton}
                  >
                    Reject
                  </button>
                </div>
              )}
              
              {/* Show cancel button only for owner pending requests */}
              {showCancelButton && (
                <div style={styles.actions}>
                  <button 
                    onClick={() => handleCancel(approval.id, approval.displayName || 'Untitled Approval')}
                    style={styles.cancelButton}
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <button onClick={loadApprovals} style={styles.refreshButton}>
        Refresh List
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px'
  },
  error: {
    color: 'red',
    padding: '20px',
    textAlign: 'center'
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #ddd'
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.3s'
  },
  activeTab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid #0078d4',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#0078d4',
    transition: 'all 0.3s'
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  },
  list: {
    marginTop: '20px'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  actions: {
    marginTop: '12px',
    display: 'flex',
    gap: '10px'
  },
  approveButton: {
    padding: '8px 16px',
    backgroundColor: '#107c10',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  rejectButton: {
    padding: '8px 16px',
    backgroundColor: '#d13438',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    width: '100%'
  },
  refreshButton: {
    padding: '10px 20px',
    marginTop: '20px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  }
};

export default ApprovalsList;
