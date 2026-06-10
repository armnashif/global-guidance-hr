import React from 'react'

export default function Notifications({ supabase, currentUser, setUnreadCount }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Notifications</h1>
      <p className="text-gray-600 mb-8">View and manage your notifications</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Notification center - System alerts and updates</p>
      </div>
    </div>
  )
}
