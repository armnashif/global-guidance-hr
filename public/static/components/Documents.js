import React from 'react'

export default function Documents({ supabase, currentUser }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Document Management</h1>
      <p className="text-gray-600 mb-8">Upload, organize, and manage HR documents</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Document management - Policies, onboarding, training materials</p>
      </div>
    </div>
  )
}
