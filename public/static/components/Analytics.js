import React from 'react'

export default function Analytics({ supabase, currentUser }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Analytics & Reports</h1>
      <p className="text-gray-600 mb-8">View insights and generate reports</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Analytics dashboard - Charts and metrics</p>
      </div>
    </div>
  )
}
