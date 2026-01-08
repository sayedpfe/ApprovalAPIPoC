import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import approvalService from '../services/approvalService';

function ApprovalsList() {
  const { instance, accounts } = useMsal();
  const [approverApprovals, setApproverApprovals] = useState([]);
  const [ownerApprovals, setOwnerApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('approver'); // 'approver' or 'owner'

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
      console.log('Total approvals fetched:', allApprovals.length);
      
      // Separate approvals into two categories
      const approvalsWhereImApprover = [];
      const approvalsWhereImOwner = [];
      
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
        
        console.log(`  Is Approver? ${isApprover}, Is Owner? ${isOwner}`);
        
        // Add to appropriate lists
        if (isApprover && !isOwner) {
          approvalsWhereImApprover.push(approval);
        }
        if (isOwner) {
          approvalsWhereImOwner.push(approval);
        }
      });
      
      console.log('=== Filtered Results ===');
      console.log('Approvals where I am approver:', approvalsWhereImApprover.length);
      console.log('Approvals where I am owner:', approvalsWhereImOwner.length);
      
      setApproverApprovals(approvalsWhereImApprover);
      setOwnerApprovals(approvalsWhereImOwner);
      setError(null);
    } catch (err) {
      console.error('Error loading approvals:', err);
      setError('Failed to load approvals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (approvalId, response) => {
    console.log(`=== Responding to Approval ===`);
    console.log('Approval ID:', approvalId);
    console.log('Response:', response);
    
    try {
      // First, get the approval requests to find the request ID for the current user
      const requestsData = await approvalService.getApprovalRequests(approvalId, instance, accounts);
      const requests = requestsData.value || [];
      
      console.log('Found requests:', requests.length);
      
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
        throw new Error('No approval request found for the current user');
      }
      
      console.log('My request ID:', myRequest.id);
      console.log('Request status:', myRequest.status);
      
      // Now respond to the specific request
      const result = await approvalService.respondToApproval(
        approvalId, 
        response, 
        'Response from PoC', 
        instance, 
        accounts
      );
      
      console.log('Response result:', result);
      alert(`Successfully ${response} the approval`);
      await loadApprovals();
    } catch (err) {
      console.error('Error responding to approval:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      alert('Failed to respond to approval: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  if (loading) return <div style={styles.loading}>Loading approvals...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  const currentApprovals = activeTab === 'approver' ? approverApprovals : ownerApprovals;

  return (
    <div style={styles.container}>
      <h2>My Approval Requests</h2>
      
      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('approver')}
          style={activeTab === 'approver' ? styles.activeTab : styles.tab}
        >
          Pending My Approval ({approverApprovals.length})
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          style={activeTab === 'owner' ? styles.activeTab : styles.tab}
        >
          I Created ({ownerApprovals.length})
        </button>
      </div>

      {/* Content based on active tab */}
      {currentApprovals.length === 0 ? (
        <p style={styles.emptyMessage}>
          {activeTab === 'approver' 
            ? 'No approvals pending your response.' 
            : 'You have not created any approval requests.'}
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
              
              {/* Show action buttons only for approver tab */}
              {activeTab === 'approver' && (
                <div style={styles.actions}>
                  <button 
                    onClick={() => handleRespond(approval.id, 'approved')}
                    style={styles.approveButton}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRespond(approval.id, 'rejected')}
                    style={styles.rejectButton}
                  >
                    Reject
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
