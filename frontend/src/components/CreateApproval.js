import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import approvalService from '../services/approvalService';

function CreateApproval() {
  const { instance, accounts } = useMsal();
  const [approvalType, setApprovalType] = useState('basic'); // 'basic' or 'basicAwaitAll'
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    ownerEmail: ''
  });
  const [approvers, setApprovers] = useState([{ email: '', user: null }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userSearchResults, setUserSearchResults] = useState({});
  const [ownerSearchResults, setOwnerSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState({});

  // Search for users in Azure AD
  const searchUsers = async (searchTerm, index = null) => {
    if (searchTerm.length < 2) {
      if (index !== null) {
        setUserSearchResults({ ...userSearchResults, [index]: [] });
      } else {
        setOwnerSearchResults([]);
      }
      return;
    }

    const key = index !== null ? index : 'owner';
    setSearchingUsers({ ...searchingUsers, [key]: true });

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read.All'],
        account: accounts[0]
      });

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users?$filter=startswith(displayName,'${searchTerm}') or startswith(mail,'${searchTerm}') or startswith(userPrincipalName,'${searchTerm}')&$select=id,displayName,mail,userPrincipalName&$top=10`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.accessToken}`
          }
        }
      );

      const data = await response.json();
      
      if (index !== null) {
        setUserSearchResults({ ...userSearchResults, [index]: data.value || [] });
      } else {
        setOwnerSearchResults(data.value || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers({ ...searchingUsers, [key]: false });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Search for owner when typing
    if (name === 'ownerEmail') {
      searchUsers(value, null);
    }
  };

  const handleOwnerSelect = (user) => {
    setFormData({
      ...formData,
      ownerEmail: user.mail || user.userPrincipalName
    });
    setOwnerSearchResults([]);
  };

  const handleApproverChange = (index, value) => {
    const newApprovers = [...approvers];
    newApprovers[index].email = value;
    setApprovers(newApprovers);
    
    // Search for users when typing in email field
    searchUsers(value, index);
  };

  const handleApproverSelect = (index, user) => {
    const newApprovers = [...approvers];
    newApprovers[index].email = user.mail || user.userPrincipalName;
    newApprovers[index].user = user;
    setApprovers(newApprovers);
    setUserSearchResults({ ...userSearchResults, [index]: [] });
  };

  const addApprover = () => {
    setApprovers([...approvers, { email: '', user: null }]);
  };

  const removeApprover = (index) => {
    if (approvers.length > 1) {
      const newApprovers = approvers.filter((_, i) => i !== index);
      setApprovers(newApprovers);
    }
  };

  const handleApprovalTypeChange = (type) => {
    setApprovalType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Build approvers array - no stage property, just user identities
      const approversData = approvers
        .filter(a => a.email.trim() !== '')
        .map((approver) => ({
          user: {
            id: approver.email.trim()
          }
        }));

      if (approversData.length === 0) {
        setMessage('Please add at least one approver');
        setLoading(false);
        return;
      }

      // Get current user info for owner
      const ownerUserId = formData.ownerEmail.trim() || accounts[0].username;

      const approvalData = {
        displayName: formData.displayName.trim(),
        description: formData.description.trim() || undefined,
        approvalType: approvalType,
        approvers: approversData,
        owner: {
          user: {
            id: ownerUserId
          }
        }
      };

      // Remove undefined values
      if (!approvalData.description) {
        delete approvalData.description;
      }

      console.log('Creating approval with type:', approvalType);
      console.log('Approval data:', JSON.stringify(approvalData, null, 2));

      const result = await approvalService.createApproval(approvalData, instance, accounts);
      console.log('Approval created successfully:', result);
      setMessage('✅ Approval request created successfully!');
      
      // Reset form
      setFormData({
        displayName: '',
        description: '',
        ownerEmail: ''
      });
      setApprovers([{ email: '', user: null }]);
      setApprovalType('basic');
    } catch (error) {
      console.error('Error creating approval:', error);
      let errorMessage = 'Failed to create approval';
      
      if (error.response?.data?.error?.message) {
        errorMessage += ': ' + error.response.data.error.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setMessage('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create New Approval Request</h2>
      
      {message && (
        <div style={message.includes('✅') ? styles.successMessage : styles.errorMessage}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Approval Type Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Approval Type:</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="basic"
                checked={approvalType === 'basic'}
                onChange={() => handleApprovalTypeChange('basic')}
                style={styles.radio}
              />
              <span style={styles.radioText}>Any Approver (Any one approver can approve)</span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="basicAwaitAll"
                checked={approvalType === 'basicAwaitAll'}
                onChange={() => handleApprovalTypeChange('basicAwaitAll')}
                style={styles.radio}
              />
              <span style={styles.radioText}>All Approvers (All approvers must approve)</span>
            </label>
          </div>
        </div>

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

        {/* Approvers Section */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Approvers:
          </label>
          <div style={styles.approversList}>
            {approvers.map((approver, index) => (
              <div key={index} style={styles.approverRow}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={approver.email}
                    onChange={(e) => handleApproverChange(index, e.target.value)}
                    required
                    style={styles.approverInput}
                    placeholder="Search for approver by name or email"
                    autoComplete="off"
                  />
                  {userSearchResults[index] && userSearchResults[index].length > 0 && (
                    <div style={styles.dropdown}>
                      {userSearchResults[index].map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleApproverSelect(index, user)}
                          style={styles.dropdownItem}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <div style={styles.userName}>{user.displayName}</div>
                          <div style={styles.userEmail}>{user.mail || user.userPrincipalName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {approvers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeApprover(index)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addApprover}
            style={styles.addButton}
          >
            + Add Another Approver
          </button>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Owner (optional):</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="ownerEmail"
              value={formData.ownerEmail}
              onChange={handleChange}
              style={styles.input}
              placeholder="Search for owner by name or email"
              autoComplete="off"
            />
            {ownerSearchResults.length > 0 && (
              <div style={styles.dropdown}>
                {ownerSearchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleOwnerSelect(user)}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <div style={styles.userName}>{user.displayName}</div>
                    <div style={styles.userEmail}>{user.mail || user.userPrincipalName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={loading ? styles.buttonDisabled : styles.button}
        >
          {loading ? 'Creating...' : 'Create Approval Request'}
        </button>
      </form>

      {approvalType === 'basicAwaitAll' && (
        <div style={styles.infoBox}>
          <strong>ℹ️ All Approvers Mode:</strong>
          <ul style={styles.infoList}>
            <li>All approvers must approve before the request is completed</li>
            <li>If any approver rejects, the entire approval is rejected</li>
            <li>All approvers receive the request simultaneously</li>
          </ul>
        </div>
      )}
      {approvalType === 'basic' && (
        <div style={styles.infoBox}>
          <strong>ℹ️ Any Approver Mode:</strong>
          <ul style={styles.infoList}>
            <li>Only one approver needs to approve to complete the request</li>
            <li>All approvers receive the request simultaneously</li>
            <li>First response (approve or reject) determines the outcome</li>
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '700px',
    margin: '0 auto'
  },
  form: {
    marginTop: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#323130',
    fontSize: '14px'
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '10px',
    border: '1px solid #e1dfdd',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  },
  radio: {
    marginRight: '10px',
    cursor: 'pointer'
  },
  radioText: {
    fontSize: '14px',
    color: '#323130'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  approversList: {
    marginBottom: '10px'
  },
  approverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  stageLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0078d4',
    backgroundColor: '#f3f2f1',
    padding: '6px 12px',
    borderRadius: '12px',
    minWidth: '65px',
    textAlign: 'center'
  },
  approverInput: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #8a8886',
    borderRadius: '4px'
  },
  removeButton: {
    padding: '6px 10px',
    backgroundColor: '#d13438',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f2f1',
    color: '#323130',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '5px'
  },
  hint: {
    display: 'block',
    marginTop: '5px',
    fontSize: '12px',
    color: '#605e5c',
    fontStyle: 'italic'
  },
  button: {
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px'
  },
  buttonDisabled: {
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#8a8886',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    width: '100%',
    marginTop: '10px'
  },
  successMessage: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#dff6dd',
    color: '#107c10',
    borderRadius: '4px',
    borderLeft: '4px solid #107c10',
    fontSize: '14px'
  },
  errorMessage: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fde7e9',
    color: '#d13438',
    borderRadius: '4px',
    borderLeft: '4px solid #d13438',
    fontSize: '14px'
  },
  infoBox: {
    marginTop: '25px',
    padding: '15px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
    borderLeft: '4px solid #0078d4',
    fontSize: '14px'
  },
  infoList: {
    marginTop: '10px',
    marginBottom: '0',
    paddingLeft: '20px'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    marginTop: '2px'
  },
  dropdownItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #edebe9'
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#323130'
  },
  userEmail: {
    fontSize: '12px',
    color: '#605e5c',
    marginTop: '2px'
  }
};

export default CreateApproval;
