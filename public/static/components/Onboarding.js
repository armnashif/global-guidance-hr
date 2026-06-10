import React from 'react'

export default function Onboarding({ supabase, currentUser }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Employee Onboarding</h1>
      <p className="text-gray-600 mb-8">Manage new employee onboarding process</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Onboarding workflow - Welcome packages and checklists</p>
      </div>
    </div>
  )
}
