import React from 'react'

export default function Training({ supabase, currentUser }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Training & Development</h1>
      <p className="text-gray-600 mb-8">Manage training programs and employee development</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Training roadmap Q1-Q4 2026 - $15,000 budget allocation</p>
      </div>
    </div>
  )
}
