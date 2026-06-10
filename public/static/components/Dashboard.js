import React, { useState, useEffect } from 'react'

export default function Dashboard({ supabase, currentUser }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departments: 0,
    pendingLeave: 0,
    upcomingTraining: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load employees count
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
      
      // Load departments
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*')

      // Load pending leave requests
      const { data: leaveRequests, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending')

      // Load upcoming training
      const { data: training, error: trainingError } = await supabase
        .from('training_programs')
        .select('*')
        .gte('start_date', new Date().toISOString().split('T')[0])

      setStats({
        totalEmployees: employees?.length || 0,
        departments: departments?.length || 0,
        pendingLeave: leaveRequests?.length || 0,
        upcomingTraining: training?.length || 0
      })

      // Load recent activities (simulated for now)
      setRecentActivities([
        { id: 1, type: 'employee', message: 'New employee onboarded: Binupa', time: '2 hours ago' },
        { id: 2, type: 'leave', message: 'Leave request approved for Sukaina', time: '5 hours ago' },
        { id: 3, type: 'training', message: 'Training session completed: CRM Advanced', time: '1 day ago' },
        { id: 4, type: 'performance', message: 'Q1 KPI reviews submitted by all departments', time: '2 days ago' }
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {currentUser?.name}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your team today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon="fa-users"
          color="bg-blue-500"
        />
        <StatCard
          title="Departments"
          value={stats.departments}
          icon="fa-building"
          color="bg-green-500"
        />
        <StatCard
          title="Pending Leave"
          value={stats.pendingLeave}
          icon="fa-calendar-check"
          color="bg-yellow-500"
        />
        <StatCard
          title="Upcoming Training"
          value={stats.upcomingTraining}
          icon="fa-graduation-cap"
          color="bg-purple-500"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <i className={`fas ${getActivityIcon(activity.type)} text-primary-600`}></i>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-gray-800">{activity.message}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionButton icon="fa-user-plus" label="Add Employee" />
            <QuickActionButton icon="fa-file-alt" label="Leave Request" />
            <QuickActionButton icon="fa-chart-line" label="View Reports" />
            <QuickActionButton icon="fa-clipboard-list" label="Run Payroll" />
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Department Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DepartmentCard name="Executive" count={2} color="bg-purple-500" />
          <DepartmentCard name="Admin/HR" count={3} color="bg-blue-500" />
          <DepartmentCard name="BD & Visa" count={2} color="bg-green-500" />
          <DepartmentCard name="Marketing" count={2} color="bg-orange-500" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <i className={`fas ${icon} text-white text-xl`}></i>
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ icon, label }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <i className={`fas ${icon} text-primary-600 text-2xl mb-2`}></i>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  )
}

function DepartmentCard({ name, count, color }) {
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mr-3`}>
        <i className="fas fa-users text-white"></i>
      </div>
      <div>
        <p className="text-sm text-gray-500">{name}</p>
        <p className="text-xl font-bold text-gray-800">{count} employees</p>
      </div>
    </div>
  )
}

function getActivityIcon(type) {
  switch (type) {
    case 'employee': return 'fa-user'
    case 'leave': return 'fa-calendar'
    case 'training': return 'fa-graduation-cap'
    case 'performance': return 'fa-chart-line'
    default: return 'fa-info-circle'
  }
}
