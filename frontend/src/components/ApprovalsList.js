import React, { useState, useEffect } from 'react';
import approvalService from '../services/approvalService';

function ApprovalsList() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getApprovals();
      setApprovals(data.value || []);
      setError(null);
    } catch (err) {
      setError('Failed to load approvals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id, response) => {
    try {
      await approvalService.respondToApproval(id, response, 'Response from PoC');
      alert(`Successfully ${response} the approval`);
      loadApprovals();
    } catch (err) {
      alert('Failed to respond to approval: ' + err.message);
    }
  };

  if (loading) return <div style={styles.loading}>Loading approvals...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h2>My Approval Requests</h2>
      {approvals.length === 0 ? (
        <p>No approval requests found.</p>
      ) : (
        <div style={styles.list}>
          {approvals.map((approval) => (
            <div key={approval.id} style={styles.card}>
              <h3>{approval.displayName || 'Untitled Approval'}</h3>
              <p><strong>Status:</strong> {approval.status}</p>
              <p><strong>Created:</strong> {new Date(approval.createdDateTime).toLocaleString()}</p>
              {approval.description && <p>{approval.description}</p>}
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
  list: {
    marginTop: '20px'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#fff'
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
    cursor: 'pointer'
  },
  rejectButton: {
    padding: '8px 16px',
    backgroundColor: '#d13438',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  refreshButton: {
    padding: '10px 20px',
    marginTop: '20px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default ApprovalsList;
