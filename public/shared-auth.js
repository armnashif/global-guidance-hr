// Shared authentication utilities for all Global Guidance HR pages
// ================================================================
// These module pages are ALWAYS loaded inside iframes by the parent React app.
// The parent app handles all authentication/login/logout.
// This script NEVER redirects - it only provides utility functions.
// ================================================================

const AUTH_KEY = 'gg_hr_session';
const AUTH_EXPIRY_KEY = 'gg_hr_session_expiry';

// Detect iframe context
const isInIframe = (function() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
})();

// Get current user from localStorage session
function getCurrentUser() {
    try {
        const session = localStorage.getItem(AUTH_KEY);
        if (!session) return null;
        const user = JSON.parse(session);
        if (user && user.id && user.username) return user;
        return null;
    } catch (e) {
        return null;
    }
}

// Check if user is authenticated (returns boolean, NEVER redirects)
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Initialize user info on page (populates userName, userRole, employeeId elements)
function initializeUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = user.name;
        
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) userRoleEl.textContent = user.role;
        
        const employeeIdEl = document.getElementById('employeeId');
        if (employeeIdEl) employeeIdEl.textContent = user.employeeId;
        
        return user;
    }
    return null;
}

// protectPage - kept for backward compatibility but NEVER redirects
// Module pages are always in iframes; the parent React app handles auth.
function protectPage() {
    initializeUserInfo();
    return true;
}

// Logout function - notify parent app (never redirect from iframe)
function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    if (isInIframe) {
        try {
            window.parent.postMessage({ type: 'LOGOUT' }, '*');
        } catch (e) {
            // Cannot communicate with parent - do nothing
        }
    }
}

// On page load, initialize user info
window.addEventListener('DOMContentLoaded', function() {
    initializeUserInfo();
});
