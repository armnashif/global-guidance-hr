import React from 'react'

export default function LeaveManagement({ supabase, currentUser }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Leave Management</h1>
      <p className="text-gray-600 mb-8">Request, approve, and track employee leave</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Leave management system - 22 days annual leave tracking</p>
      </div>
    </div>
  )
}
