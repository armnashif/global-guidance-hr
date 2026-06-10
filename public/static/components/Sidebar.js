import React from 'react'

export default function Sidebar({ currentView, setCurrentView, unreadNotifications, currentUser }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-home' },
    { id: 'employees', label: 'Employees', icon: 'fa-users' },
    { id: 'skills', label: 'Skills Matrix', icon: 'fa-chart-bar' },
    { id: 'performance', label: 'Performance', icon: 'fa-trophy' },
    { id: 'compensation', label: 'Compensation', icon: 'fa-dollar-sign' },
    { id: 'leave', label: 'Leave Management', icon: 'fa-calendar-alt' },
    { id: 'training', label: 'Training', icon: 'fa-graduation-cap' },
    { id: 'messaging', label: 'Messaging', icon: 'fa-comments' },
    { id: 'documents', label: 'Documents', icon: 'fa-folder-open' },
    { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
    { id: 'onboarding', label: 'Onboarding', icon: 'fa-user-plus' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell', badge: unreadNotifications }
  ]

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Global Guidance</h1>
        <p className="text-sm text-gray-500">HR Management System</p>
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
              currentView === item.id
                ? 'bg-primary-50 text-primary-600 border-r-4 border-primary-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="ml-3 flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2026 Global Guidance
        </p>
      </div>
    </div>
  )
}
