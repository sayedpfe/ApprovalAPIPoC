import React, { useState } from 'react';
import approvalService from '../services/approvalService';

function CreateApproval() {
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    approverEmail: '',
    ownerEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const approvalData = {
        displayName: formData.displayName,
        description: formData.description,
        approvers: [
          {
            user: {
              id: formData.approverEmail // In production, this should be the user's object ID
            }
          }
        ],
        owner: {
          user: {
            id: formData.ownerEmail // In production, this should be the user's object ID
          }
        }
      };

      await approvalService.createApproval(approvalData);
      setMessage('Approval request created successfully!');
      setFormData({
        displayName: '',
        description: '',
        approverEmail: '',
        ownerEmail: ''
      });
    } catch (error) {
      setMessage('Failed to create approval: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create New Approval Request</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Title:</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter approval title"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Enter approval description"
            rows="4"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Approver User ID:</label>
          <input
            type="text"
            name="approverEmail"
            value={formData.approverEmail}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter approver's user ID/email"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Owner User ID:</label>
          <input
            type="text"
            name="ownerEmail"
            value={formData.ownerEmail}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter owner's user ID/email"
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Creating...' : 'Create Approval'}
        </button>

        {message && (
          <div style={message.includes('successfully') ? styles.success : styles.error}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  form: {
    marginTop: '20px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#323130'
  },
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  },
  success: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#dff6dd',
    color: '#107c10',
    borderRadius: '4px'
  },
  error: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fde7e9',
    color: '#d13438',
    borderRadius: '4px'
  }
};

export default CreateApproval;
