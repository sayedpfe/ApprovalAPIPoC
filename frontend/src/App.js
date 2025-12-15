import React, { useState } from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { SignInButton, SignOutButton } from './components/SignInSignOutButton';
import ApprovalsList from './components/ApprovalsList';
import CreateApproval from './components/CreateApproval';
import './App.css';

function App() {
  const { accounts } = useMsal();
  const [activeTab, setActiveTab] = useState('list');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Microsoft Graph Approvals API - PoC</h1>
        <AuthenticatedTemplate>
          <div style={styles.userInfo}>
            <span>Welcome, {accounts[0]?.name || accounts[0]?.username}</span>
            <SignOutButton />
          </div>
        </AuthenticatedTemplate>
      </header>

      <main className="App-main">
        <UnauthenticatedTemplate>
          <div style={styles.signInContainer}>
            <h2>Please sign in to access the Approvals API</h2>
            <p>This PoC demonstrates integration with Microsoft Graph Approvals API.</p>
            <SignInButton />
          </div>
        </UnauthenticatedTemplate>

        <AuthenticatedTemplate>
          <div style={styles.tabContainer}>
            <button 
              onClick={() => setActiveTab('list')}
              style={activeTab === 'list' ? styles.activeTab : styles.tab}
            >
              My Approvals
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              style={activeTab === 'create' ? styles.activeTab : styles.tab}
            >
              Create Approval
            </button>
          </div>

          <div style={styles.content}>
            {activeTab === 'list' && <ApprovalsList />}
            {activeTab === 'create' && <CreateApproval />}
          </div>
        </AuthenticatedTemplate>
      </main>

      <footer style={styles.footer}>
        <p>Microsoft Graph Approvals API PoC © 2025</p>
      </footer>
    </div>
  );
}

const styles = {
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'white'
  },
  signInContainer: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  tabContainer: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #ddd',
    marginBottom: '20px'
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#605e5c'
  },
  activeTab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #0078d4',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#0078d4',
    fontWeight: 'bold'
  },
  content: {
    minHeight: '400px'
  },
  footer: {
    marginTop: '40px',
    padding: '20px',
    textAlign: 'center',
    borderTop: '1px solid #ddd',
    color: '#605e5c'
  }
};

export default App;
