import React from 'react'

export default function Compensation({ supabase, currentUser }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Compensation & Benefits</h1>
      <p className="text-gray-600 mb-8">Manage salary bands, benefits, and compensation packages</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Compensation module - Track salaries, benefits, and cost analysis</p>
      </div>
    </div>
  )
}
