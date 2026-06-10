// Global Guidance HR Management System - Vanilla JavaScript Version

const USERS_DB = {
  'nashif.razzak': { password: 'password123', employee_id: 'GG001', name: 'Nashif A. Razzak', role: 'CEO', department: 'Executive', access_level: 'admin' },
  'nafees.razzak': { password: 'password123', employee_id: 'GG002', name: 'Nafees Razzak', role: 'COO', department: 'Executive', access_level: 'admin' },
  'thasbiha.s': { password: 'password123', employee_id: 'GG003', name: 'Thasbiha S.', role: 'Head of Admin/HR', department: 'Admin/HR', access_level: 'hr_manager' },
  'umair': { password: 'password123', employee_id: 'GG004', name: 'Umair', role: 'Sr. Admin Executive', department: 'Admin/HR', access_level: 'hr_staff' },
  'mohamed.s': { password: 'password123', employee_id: 'GG005', name: 'Mohamed S.', role: 'HR & Communications', department: 'Admin/HR', access_level: 'hr_staff' },
  'razan.thawus': { password: 'password123', employee_id: 'GG006', name: 'Razan Thawus', role: 'Head of BD/Visa', department: 'BD & Visa', access_level: 'manager' },
  'sukaina': { password: 'password123', employee_id: 'GG007', name: 'Sukaina', role: 'Student Counselor', department: 'BD & Visa', access_level: 'employee' },
  'binupa': { password: 'password123', employee_id: 'GG008', name: 'Binupa', role: 'Content Creator', department: 'Marketing', access_level: 'employee' },
  'shiran': { password: 'password123', employee_id: 'GG009', name: 'Shiran', role: 'Graphic Designer', department: 'Marketing', access_level: 'employee' }
};

let currentUser = null;
let currentView = 'dashboard';

function render() {
  const root = document.getElementById('root');
  if (!currentUser) {
    root.innerHTML = renderLoginPage();
    attachLoginEvents();
  } else {
    root.innerHTML = renderMainApp();
    attachAppEvents();
  }
}

function renderLoginPage() {
  return `
    <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-building text-white text-3xl"></i>
          </div>
          <h1 class="text-3xl font-bold text-gray-800">Global Guidance</h1>
          <p class="text-gray-600 mt-2">HR Management System</p>
        </div>
        
        <form id="loginForm" class="space-y-6">
          <div id="errorMsg" class="hidden bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p class="text-red-700 text-sm"></p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div class="relative">
              <i class="fas fa-user absolute left-3 top-3 text-gray-400"></i>
              <input type="text" id="username" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Enter username" required>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
              <i class="fas fa-lock absolute left-3 top-3 text-gray-400"></i>
              <input type="password" id="password" class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Enter password" required>
            </div>
          </div>
          
          <button type="submit" class="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In
          </button>
        </form>
        
        <div class="mt-6">
          <button id="toggleQuick" class="w-full text-center text-sm text-primary-600 hover:text-primary-700">
            Show Quick Login (Demo)
          </button>
        </div>
        
        <div id="quickLogins" class="mt-4 space-y-2 hidden">
          <p class="text-xs text-gray-500 text-center mb-3">Click to login instantly:</p>
          <button onclick="quickLogin('nashif.razzak')" class="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-left text-sm">
            <i class="fas fa-crown mr-2"></i>CEO - Full Access
          </button>
          <button onclick="quickLogin('thasbiha.s')" class="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-left text-sm">
            <i class="fas fa-user-tie mr-2"></i>HR Manager
          </button>
          <button onclick="quickLogin('razan.thawus')" class="w-full px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-left text-sm">
            <i class="fas fa-users mr-2"></i>Dept Manager
          </button>
          <button onclick="quickLogin('sukaina')" class="w-full px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 text-left text-sm">
            <i class="fas fa-user mr-2"></i>Employee
          </button>
        </div>
        
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-600 text-center">
            <i class="fas fa-info-circle mr-1"></i>Demo: All passwords are "password123"
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderMainApp() {
  return `
    <div class="flex h-screen bg-gray-50">
      ${renderSidebar()}
      <div class="flex-1 overflow-auto">
        ${renderCurrentView()}
      </div>
    </div>
  `;
}

function renderSidebar() {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-home', roles: ['admin', 'hr_manager', 'hr_staff', 'manager', 'employee'] },
    { id: 'employees', label: 'Employees', icon: 'fa-users', roles: ['admin', 'hr_manager', 'hr_staff', 'manager'] },
    { id: 'skills', label: 'Skills Matrix', icon: 'fa-chart-bar', roles: ['admin', 'hr_manager', 'manager'] },
    { id: 'performance', label: 'Performance', icon: 'fa-trophy', roles: ['admin', 'hr_manager', 'manager'] },
    { id: 'leave', label: 'Leave', icon: 'fa-calendar-alt', roles: ['admin', 'hr_manager', 'hr_staff', 'manager', 'employee'] },
    { id: 'training', label: 'Training', icon: 'fa-graduation-cap', roles: ['admin', 'hr_manager', 'manager', 'employee'] },
    { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie', roles: ['admin', 'manager'] }
  ].filter(item => item.roles.includes(currentUser.access_level));

  const badges = {
    'admin': { color: 'bg-purple-100 text-purple-700', label: 'Admin', icon: 'fa-crown' },
    'hr_manager': { color: 'bg-blue-100 text-blue-700', label: 'HR Manager', icon: 'fa-user-tie' },
    'hr_staff': { color: 'bg-cyan-100 text-cyan-700', label: 'HR Staff', icon: 'fa-user-check' },
    'manager': { color: 'bg-green-100 text-green-700', label: 'Manager', icon: 'fa-users' },
    'employee': { color: 'bg-gray-100 text-gray-700', label: 'Employee', icon: 'fa-user' }
  };
  const badge = badges[currentUser.access_level];

  return `
    <div class="w-64 bg-white shadow-lg flex flex-col h-screen">
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-primary-600">Global Guidance</h1>
        <p class="text-sm text-gray-500">HR Management System</p>
      </div>
      
      <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div class="flex items-start">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
            ${currentUser.name.charAt(0)}
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-semibold text-gray-800">${currentUser.name}</p>
            <p class="text-xs text-gray-600">${currentUser.role}</p>
            <div class="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}">
              <i class="fas ${badge.icon} mr-1"></i>${badge.label}
            </div>
          </div>
        </div>
      </div>
      
      <nav class="flex-1 overflow-y-auto py-4">
        ${menuItems.map(item => `
          <button onclick="navigateTo('${item.id}')" class="w-full flex items-center px-6 py-3 text-left transition-colors ${
            currentView === item.id
              ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }">
            <i class="fas ${item.icon} w-5"></i>
            <span class="ml-3">${item.label}</span>
          </button>
        `).join('')}
      </nav>
      
      <div class="p-4 border-t border-gray-200">
        <button onclick="logout()" class="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors mb-3">
          <i class="fas fa-sign-out-alt mr-2"></i>Logout
        </button>
        <p class="text-xs text-gray-500 text-center">© 2026 Global Guidance</p>
      </div>
    </div>
  `;
}

function renderCurrentView() {
  switch(currentView) {
    case 'dashboard': return renderDashboard();
    case 'employees': return renderEmployees();
    case 'skills': return renderSkills();
    case 'performance': return renderPerformance();
    case 'leave': return renderLeave();
    case 'training': return renderTraining();
    case 'analytics': return renderAnalytics();
    default: return renderDashboard();
  }
}

function renderDashboard() {
  const features = {
    'admin': ['All Employees', 'All Salaries', 'All Approvals', 'Analytics', 'User Management'],
    'hr_manager': ['All Employees', 'Leave Approval', 'Training Management', 'Documents'],
    'hr_staff': ['View Employees', 'Edit Profiles', 'Leave Management', 'Documents'],
    'manager': ['Team Members', 'Team Leave Approval', 'Team Performance', 'Team Training'],
    'employee': ['Own Profile', 'Leave Requests', 'Own Performance', 'Training Enrollment']
  };

  return `
    <div class="p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Welcome, ${currentUser.name}!</h1>
        <p class="text-gray-600 mt-2">You have ${currentUser.access_level.replace('_', ' ')} access</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div><p class="text-gray-500 text-sm">Total Employees</p><p class="text-3xl font-bold text-gray-800 mt-2">9</p></div>
            <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center"><i class="fas fa-users text-white text-xl"></i></div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div><p class="text-gray-500 text-sm">Departments</p><p class="text-3xl font-bold text-gray-800 mt-2">4</p></div>
            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center"><i class="fas fa-building text-white text-xl"></i></div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div><p class="text-gray-500 text-sm">Pending Leave</p><p class="text-3xl font-bold text-gray-800 mt-2">3</p></div>
            <div class="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center"><i class="fas fa-calendar-check text-white text-xl"></i></div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div><p class="text-gray-500 text-sm">Training Programs</p><p class="text-3xl font-bold text-gray-800 mt-2">6</p></div>
            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center"><i class="fas fa-graduation-cap text-white text-xl"></i></div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-shield-alt text-primary-600 mr-2"></i>Your Access: ${currentUser.access_level.replace('_', ' ').toUpperCase()}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="font-medium text-gray-700 mb-3">Available Features:</h3>
            <ul class="space-y-2">
              ${features[currentUser.access_level].map(f => `
                <li class="flex items-center text-sm text-gray-600">
                  <i class="fas fa-check-circle text-green-500 mr-2"></i>${f}
                </li>
              `).join('')}
            </ul>
          </div>
          <div>
            <h3 class="font-medium text-gray-700 mb-3">Your Information:</h3>
            <div class="space-y-2 text-sm">
              <p class="flex justify-between"><span class="text-gray-500">Employee ID:</span><span class="font-medium">${currentUser.employee_id}</span></p>
              <p class="flex justify-between"><span class="text-gray-500">Department:</span><span class="font-medium">${currentUser.department}</span></p>
              <p class="flex justify-between"><span class="text-gray-500">Position:</span><span class="font-medium">${currentUser.role}</span></p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Department Overview</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center p-4 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3"><i class="fas fa-users text-white"></i></div>
            <div><p class="text-sm text-gray-500">Executive</p><p class="text-xl font-bold text-gray-800">2 employees</p></div>
          </div>
          <div class="flex items-center p-4 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3"><i class="fas fa-users text-white"></i></div>
            <div><p class="text-sm text-gray-500">Admin/HR</p><p class="text-xl font-bold text-gray-800">3 employees</p></div>
          </div>
          <div class="flex items-center p-4 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3"><i class="fas fa-users text-white"></i></div>
            <div><p class="text-sm text-gray-500">BD & Visa</p><p class="text-xl font-bold text-gray-800">2 employees</p></div>
          </div>
          <div class="flex items-center p-4 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3"><i class="fas fa-users text-white"></i></div>
            <div><p class="text-sm text-gray-500">Marketing</p><p class="text-xl font-bold text-gray-800">2 employees</p></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEmployees() {
  return `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Employee Directory</h1>
      <p class="text-gray-600 mb-8">All 9 employees</p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-center py-12 text-gray-600">Employee list will load here with full details and profiles</p>
      </div>
    </div>
  `;
}

function renderSkills() {
  return `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Skills Matrix</h1>
      <p class="text-gray-600 mb-8">Team skills with 5 proficiency levels</p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-center py-12 text-gray-600">Skills heat map will display here</p>
      </div>
    </div>
  `;
}

function renderPerformance() {
  return `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Performance Management</h1>
      <p class="text-gray-600 mb-8">KPI tracking and bonus calculations</p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-center py-12 text-gray-600">Performance data and KPI scores will load here</p>
      </div>
    </div>
  `;
}

function renderLeave() {
  return `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Leave Management</h1>
      <p class="text-gray-600 mb-8">22 days annual leave tracking</p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-center py-12 text-gray-600">Leave requests and balances will display here</p>
      </div>
    </div>
  `;
}

function renderTraining() {
  return `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Training & Development</h1>
      <p class="text-gray-600 mb-8">$15,000 annual budget - 6 programs</p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-center py-12 text-gray-600">Training programs will load here</p>
      </div>
    </div>
  `;
}

function renderAnalytics() {
  return `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
      <p class="text-gray-600 mb-8">HR metrics and insights</p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-center py-12 text-gray-600">Charts and analytics will display here</p>
      </div>
    </div>
  `;
}

function attachLoginEvents() {
  const form = document.getElementById('loginForm');
  const toggleBtn = document.getElementById('toggleQuick');
  const quickDiv = document.getElementById('quickLogins');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMsg');
    
    const user = USERS_DB[username];
    if (!user || user.password !== password) {
      errorDiv.classList.remove('hidden');
      errorDiv.querySelector('p').textContent = 'Invalid username or password';
      return;
    }
    
    currentUser = user;
    render();
  });
  
  toggleBtn.addEventListener('click', () => {
    quickDiv.classList.toggle('hidden');
    toggleBtn.textContent = quickDiv.classList.contains('hidden') ? 'Show Quick Login (Demo)' : 'Hide Quick Login';
  });
}

function attachAppEvents() {
  // Events are attached via onclick in HTML
}

function quickLogin(username) {
  currentUser = USERS_DB[username];
  render();
}

function navigateTo(view) {
  currentView = view;
  render();
}

function logout() {
  currentUser = null;
  currentView = 'dashboard';
  render();
}

// Initial render
render();
