// Simple authentication for demo purposes
// In production, use proper authentication system

function requireAuth() {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    // For demo, auto-login
    localStorage.setItem('userEmail', 'demo@smallbusiness.com');
    localStorage.setItem('userName', 'Demo User');
  }
}

function getCurrentUser() {
  return {
    email: localStorage.getItem('userEmail') || 'demo@smallbusiness.com',
    name: localStorage.getItem('userName') || 'Demo User'
  };
}

function logoutUser() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
  }
}

// Make functions available globally
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;
