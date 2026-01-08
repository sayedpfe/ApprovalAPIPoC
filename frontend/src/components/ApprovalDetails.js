import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import approvalService from '../services/approvalService';
import approvalMetadataService from '../services/approvalMetadataService';

const ApprovalDetails = ({ approvalId, onBack }) => {
  const { instance, accounts } = useMsal();
  const [approval, setApproval] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(false);
  const [responseComment, setResponseComment] = useState('');

  useEffect(() => {
    loadApprovalDetails();
  }, [approvalId]);

  const loadApprovalDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Get approval data from API
      const approvalData = await approvalService.getApprovalById(approvalId, instance, accounts);
      setApproval(approvalData);

      // Get custom metadata from localStorage
      const customData = approvalMetadataService.getMetadata(approvalId);
      setMetadata(customData);

      console.log('Approval details loaded:', approvalData);
      console.log('Custom metadata:', customData);
    } catch (err) {
      console.error('Error loading approval details:', err);
      setError('Failed to load approval details: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (decision) => {
    try {
      setResponding(true);
      setError('');

      const responseData = {
        response: decision, // 'approve' or 'reject'
        comments: responseComment.trim() || undefined
      };

      console.log('Submitting response:', responseData);
      await approvalService.respondToApproval(approvalId, responseData, responseComment, instance, accounts);
      
      // Reload approval details to show updated status
      await loadApprovalDetails();
      setResponseComment('');
      alert(`Approval ${decision === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error('Error responding to approval:', err);
      setError('Failed to respond: ' + (err.message || 'Unknown error'));
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isDueOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backButton}>← Back to List</button>
        <div style={styles.loading}>Loading approval details...</div>
      </div>
    );
  }

  if (error && !approval) {
    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backButton}>← Back to List</button>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div style={styles.container}>
        <button onClick={onBack} style={styles.backButton}>← Back to List</button>
        <div style={styles.error}>Approval not found</div>
      </div>
    );
  }

  const currentUserEmail = accounts[0]?.username;
  const isApprover = approval.approvers?.some(a => a.user?.id === currentUserEmail);
  const isPending = approval.result === 'pending';
  const canRespond = isApprover && isPending;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>← Back to List</button>

      <div style={styles.header}>
        <h2 style={styles.title}>{approval.displayName}</h2>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: 
            approval.result === 'approved' ? '#d4edda' :
            approval.result === 'rejected' ? '#f8d7da' : '#fff3cd'
        }}>
          {approval.result?.toUpperCase() || 'PENDING'}
        </span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Details</h3>
        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Description:</span>
            <span style={styles.detailValue}>{approval.description || 'No description provided'}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Approval Type:</span>
            <span style={styles.detailValue}>
              {approval.approvalType === 'basic' ? 'Any Approver' : 
               approval.approvalType === 'basicAwaitAll' ? 'All Approvers Must Approve' : 
               approval.approvalType}
            </span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Created:</span>
            <span style={styles.detailValue}>{formatDate(approval.createdDateTime)}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Completed:</span>
            <span style={styles.detailValue}>{formatDate(approval.completionDateTime)}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Owner:</span>
            <span style={styles.detailValue}>{approval.owner?.user?.id || 'Unknown'}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Email Notifications:</span>
            <span style={styles.detailValue}>
              {approval.allowEmailNotification ? '✅ Enabled' : '❌ Disabled'}
              <span style={styles.apiBadge}>API</span>
            </span>
          </div>
        </div>
      </div>

      {/* Custom Metadata Section */}
      {metadata && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            Custom Features
            <span style={styles.customBadge}>Local Storage</span>
          </h3>
          <div style={styles.detailsGrid}>
            {metadata.dueDate && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Due Date:</span>
                <span style={{
                  ...styles.detailValue,
                  color: isDueOverdue(metadata.dueDate) ? '#d13438' : '#323130',
                  fontWeight: isDueOverdue(metadata.dueDate) ? 'bold' : 'normal'
                }}>
                  {formatDate(metadata.dueDate)}
                  {isDueOverdue(metadata.dueDate) && ' ⚠️ OVERDUE'}
                </span>
              </div>
            )}
            {metadata.isSequential && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Approval Mode:</span>
                <span style={styles.detailValue}>Sequential Multi-Stage</span>
              </div>
            )}
            {metadata.attachments && metadata.attachments.length > 0 && (
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Attachments:</span>
                <div style={styles.attachmentsList}>
                  {metadata.attachments.map((att, index) => (
                    <div key={index} style={styles.attachmentItem}>
                      📎 {att.name} ({(att.size / 1024).toFixed(1)} KB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvers Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Approvers
          {metadata?.isSequential && <span style={styles.sequentialBadge}>Sequential Order</span>}
        </h3>
        <div style={styles.approversList}>
          {approval.approvers?.map((approver, index) => {
            const stage = metadata?.approversWithStages?.find(a => a.email === approver.user?.id)?.stage;
            return (
              <div key={index} style={styles.approverCard}>
                {metadata?.isSequential && stage && (
                  <span style={styles.stageLabel}>Stage {stage}</span>
                )}
                <div style={styles.approverInfo}>
                  <div style={styles.approverEmail}>{approver.user?.id}</div>
                  <div style={styles.approverStatus}>
                    Status: <strong>{approver.response?.decision || 'Pending'}</strong>
                  </div>
                  {approver.response?.respondedDateTime && (
                    <div style={styles.approverDate}>
                      Responded: {formatDate(approver.response.respondedDateTime)}
                    </div>
                  )}
                  {approver.response?.justification && (
                    <div style={styles.approverComment}>
                      Comment: "{approver.response.justification}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Section - Only show if user can respond */}
      {canRespond && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Your Response</h3>
          <div style={styles.responseContainer}>
            <textarea
              value={responseComment}
              onChange={(e) => setResponseComment(e.target.value)}
              placeholder="Add a comment (optional)"
              style={styles.responseTextarea}
              rows="4"
            />
            <div style={styles.responseButtons}>
              <button
                onClick={() => handleResponse('approve')}
                disabled={responding}
                style={{ ...styles.responseButton, ...styles.approveButton }}
              >
                {responding ? 'Processing...' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleResponse('reject')}
                disabled={responding}
                style={{ ...styles.responseButton, ...styles.rejectButton }}
              >
                {responding ? 'Processing...' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!canRespond && isPending && !isApprover && (
        <div style={styles.infoBox}>
          ℹ️ You are not an approver for this request.
        </div>
      )}

      {!isPending && (
        <div style={styles.infoBox}>
          ℹ️ This approval has been {approval.result}.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#605e5c'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fde7e9',
    color: '#a80000',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #f1aeb5'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '15px',
    borderBottom: '2px solid #0078d4'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#323130',
    margin: 0
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#323130'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e1dfdd'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#0078d4',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  detailLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#605e5c',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: '14px',
    color: '#323130'
  },
  customBadge: {
    fontSize: '11px',
    fontWeight: 'normal',
    padding: '4px 10px',
    backgroundColor: '#fff4ce',
    color: '#8a6d3b',
    borderRadius: '12px',
    border: '1px solid #ffeaa7'
  },
  apiBadge: {
    fontSize: '10px',
    fontWeight: 'normal',
    padding: '2px 6px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '8px',
    border: '1px solid #c3e6cb',
    marginLeft: '8px'
  },
  sequentialBadge: {
    fontSize: '12px',
    fontWeight: 'normal',
    padding: '4px 10px',
    backgroundColor: '#e3f2fd',
    color: '#0078d4',
    borderRadius: '12px',
    border: '1px solid #90caf9'
  },
  attachmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  attachmentItem: {
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '13px',
    border: '1px solid #e1dfdd'
  },
  approversList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  approverCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e1dfdd'
  },
  stageLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0078d4',
    backgroundColor: '#f3f2f1',
    padding: '6px 12px',
    borderRadius: '12px',
    minWidth: '65px',
    textAlign: 'center',
    flexShrink: 0
  },
  approverInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  approverEmail: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#323130'
  },
  approverStatus: {
    fontSize: '13px',
    color: '#605e5c'
  },
  approverDate: {
    fontSize: '12px',
    color: '#8a8886',
    fontStyle: 'italic'
  },
  approverComment: {
    fontSize: '13px',
    color: '#323130',
    fontStyle: 'italic',
    padding: '8px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
    marginTop: '4px'
  },
  responseContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  responseTextarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  responseButtons: {
    display: 'flex',
    gap: '10px'
  },
  responseButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  approveButton: {
    backgroundColor: '#107c10',
    color: 'white'
  },
  rejectButton: {
    backgroundColor: '#d13438',
    color: 'white'
  },
  infoBox: {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    color: '#0078d4',
    borderRadius: '6px',
    border: '1px solid #90caf9',
    fontSize: '14px'
  }
};

export default ApprovalDetails;
