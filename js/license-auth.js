// ===========================
// LICENSE KEY SYSTEM WITH DEVICE BINDING
// Anti-Sharing Protection
// ===========================

const LICENSE = {
  storageKey: 'sbfa_license',
  deviceKey: 'sbfa_device_id',
  
  // Valid license keys (You generate these for each buyer)
  // Format: XXXX-XXXX-XXXX-XXXX
  validLicenses: {
    '857Y-M4WG-M3H3-NDR7': { 
      activated: false, 
      deviceId: null, 
      activatedAt: null, 
      buyer: 'Peter King Ofori',
      email: 'Peterkin@hotmail.com',
      type: 'SINGLE',
      generated: '2026-02-05T17:23:08.549Z'
    },
    '7Y5L-KSGG-8288-WAMQ': { 
      activated: false, 
      deviceId: null, 
      activatedAt: null, 
      buyer: 'Alma Agra',
      email: 'almaa.wfg@gmail.com',
      type: 'DEMO',
      generated: '2026-02-05T17:57:07.478Z'
    },
    'D9VF-JSDK-XUMV-F2BZ': { 
      activated: false, 
      deviceId: null, 
      activatedAt: null, 
      buyer: 'Kofi',
      email: 'kobengasiedu@aarp.org',
      type: 'SINGLE',
      generated: '2026-02-06T01:09:17.959Z'
    }
  },
  
  // Generate unique device fingerprint
  async getDeviceFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      navigator.hardwareConcurrency || 'unknown',
      navigator.platform
    ];
    
    const fingerprint = components.join('|||');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  // Check if license key is valid format
  isValidFormat(key) {
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key);
  },
  
  // Validate and activate license
  async validateLicense(licenseKey) {
    if (!this.isValidFormat(licenseKey)) {
      return { valid: false, error: 'Invalid license key format' };
    }
    
    // Check if license exists in valid list
    if (!this.validLicenses[licenseKey]) {
      return { valid: false, error: 'License key not found' };
    }
    
    const licenseData = this.validLicenses[licenseKey];
    const deviceId = await this.getDeviceFingerprint();
    
    // Check if already activated on a different device
    if (licenseData.activated && licenseData.deviceId !== deviceId) {
      return { 
        valid: false, 
        error: 'This license is already activated on another device. Each license can only be used on one device.' 
      };
    }
    
    // Activate license for this device
    if (!licenseData.activated) {
      licenseData.activated = true;
      licenseData.deviceId = deviceId;
      licenseData.activatedAt = new Date().toISOString();
      
      // Save to storage
      this.saveLicenseData(licenseKey, deviceId);
    }
    
    return { valid: true, licenseKey, deviceId };
  },
  
  // Save license data to localStorage
  saveLicenseData(licenseKey, deviceId) {
    const licenseData = {
      key: licenseKey,
      deviceId: deviceId,
      activatedAt: new Date().toISOString(),
      lastVerified: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(licenseData));
    localStorage.setItem(this.deviceKey, deviceId);
  },
  
  // Check if current device is licensed
  async isLicensed() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return false;
    
    try {
      const licenseData = JSON.parse(stored);
      const currentDeviceId = await this.getDeviceFingerprint();
      
      // Verify device matches
      if (licenseData.deviceId !== currentDeviceId) {
        // Device changed - deactivate
        this.deactivate();
        return false;
      }
      
      // Verify license key is still valid
      if (!this.validLicenses[licenseData.key]) {
        this.deactivate();
        return false;
      }
      
      // Verify license hasn't been revoked
      const licenseInfo = this.validLicenses[licenseData.key];
      if (licenseInfo.deviceId !== currentDeviceId) {
        this.deactivate();
        return false;
      }
      
      return true;
    } catch (err) {
      return false;
    }
  },
  
  // Deactivate license (logout)
  deactivate() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.deviceKey);
  },
  
  // Get current license info
  getLicenseInfo() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
};

// ===========================
// LICENSE KEY UI HANDLER - FIXED VERSION
// ===========================
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 License system initializing...');
  
  const loginScreen = document.getElementById('loginScreen');
  const mainApp = document.getElementById('mainApp');
  const loginForm = document.getElementById('loginForm');
  const licenseInput = document.getElementById('licenseKeyInput');
  const loginError = document.getElementById('loginError');
  const loginSuccess = document.getElementById('loginSuccess');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Auto-format license key input (add dashes)
  if (licenseInput) {
    licenseInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
      let formatted = '';
      for (let i = 0; i < value.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) formatted += '-';
        formatted += value[i];
      }
      e.target.value = formatted;
    });
  }
  
  // Check if already licensed
  const isLicensed = await LICENSE.isLicensed();
  
  if (isLicensed) {
    console.log('✅ Valid license found - showing app');
    // Already licensed - show app immediately
    showMainApp();
  } else {
    console.log('🔓 No license found - showing login screen');
  }
  
  // Handle license activation
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const licenseKey = licenseInput.value.trim().toUpperCase();
      
      console.log('🔑 Validating license key...');
      
      // Hide previous messages
      if (loginError) loginError.style.display = 'none';
      if (loginSuccess) loginSuccess.style.display = 'none';
      
      // Validate license
      const result = await LICENSE.validateLicense(licenseKey);
      
      if (result.valid) {
        console.log('✅ License validated successfully!');
        
        // Success!
        if (loginSuccess) {
          loginSuccess.textContent = '✅ License activated! Loading your account...';
          loginSuccess.style.display = 'block';
        }
        if (loginError) loginError.style.display = 'none';
        
        // Wait a moment then show app
        setTimeout(() => {
          showMainApp();
        }, 1500);
      } else {
        console.error('❌ License validation failed:', result.error);
        
        // Error
        if (loginError) {
          loginError.textContent = '❌ ' + result.error;
          loginError.style.display = 'block';
        }
        if (loginSuccess) loginSuccess.style.display = 'none';
        if (licenseInput) {
          licenseInput.value = '';
          licenseInput.focus();
        }
        
        // Shake animation
        if (loginError) {
          loginError.style.animation = 'none';
          setTimeout(() => {
            loginError.style.animation = 'shake 0.4s ease';
          }, 10);
        }
      }
    });
  }
  
  // Handle logout/deactivation
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to deactivate this license and logout? You will need to enter your license key again.')) {
        LICENSE.deactivate();
        location.reload();
      }
    });
  }
});

// CRITICAL FIX: Properly show the main app
function showMainApp() {
  console.log('📱 Showing main app...');
  
  const loginScreen = document.getElementById('loginScreen');
  const mainApp = document.getElementById('mainApp');
  
  // Hide login screen
  if (loginScreen) {
    loginScreen.style.display = 'none';
    console.log('✅ Login screen hidden');
  }
  
  // Show main app with proper display
  if (mainApp) {
    mainApp.style.display = 'block';
    document.documentElement.style.height = '100%';
document.body.style.minHeight = '100vh';

if (mainApp) {
  mainApp.style.minHeight = '100vh';
  mainApp.style.width = '100%';
}
    mainApp.style.visibility = 'visible';
    mainApp.style.opacity = '1';
    console.log('✅ Main app display set to block');
  }
  
  // Fix body styles
  document.body.style.background = '#f7fafc';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'auto';
  
  // Wait for DOM to be ready, then initialize
  // Use requestAnimationFrame to ensure DOM is painted
  setTimeout(() => {
  console.log('🚀 Initializing app...');

  if (typeof initializeApp === 'function') {
    try {
      initializeApp();
      console.log('✅ App initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
    }
  } else {
    console.error('❌ initializeApp function not found! Make sure app.js is loaded.');
  }
}, 100);

}

// Add animations
if (!document.querySelector('style[data-license-styles]')) {
  const style = document.createElement('style');
  style.setAttribute('data-license-styles', 'true');
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;
  document.head.appendChild(style);
}
