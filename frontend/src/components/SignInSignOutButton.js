import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

function SignInButton() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  return (
    <button onClick={handleLogin} style={styles.button}>
      Sign In with Microsoft
    </button>
  );
}

function SignOutButton() {
  const { instance } = useMsal();

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error(e);
    });
  };

  return (
    <button onClick={handleLogout} style={styles.signOutButton}>
      Sign Out
    </button>
  );
}

const styles = {
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '20px'
  },
  signOutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f2f1',
    color: '#323130',
    border: '1px solid #8a8886',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '10px'
  }
};

export { SignInButton, SignOutButton };
