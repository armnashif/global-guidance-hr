import React, { useState, useEffect } from 'react'

const BONUS_STRUCTURE = {
  'Executive': { min: 15, max: 25 },
  'Admin/HR': { min: 10, max: 20 },
  'BD & Visa': { min: 10, max: 20 },
  'Marketing': { min: 8, max: 15 }
}

export default function Performance({ supabase, currentUser }) {
  const [employees, setEmployees] = useState([])
  const [kpis, setKPIs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*, departments(name)')

      const { data: kpisData } = await supabase
        .from('kpis')
        .select('*')

      setEmployees(employeesData || [])
      setKPIs(kpisData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading performance data:', error)
      setLoading(false)
    }
  }

  const calculateBonus = (salary, kpiScore, bonusPercent) => {
    return (salary * (bonusPercent / 100) * (kpiScore / 100)).toFixed(2)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Performance Management</h1>
        <p className="text-gray-600 mt-2">Track KPIs and manage employee performance reviews</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Avg KPI Score" value="87%" color="bg-green-500" />
        <StatCard title="Pending Reviews" value="3" color="bg-yellow-500" />
        <StatCard title="Top Performers" value="5" color="bg-blue-500" />
        <StatCard title="Training Needed" value="2" color="bg-orange-500" />
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Q1 2026 Performance Scores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Bonus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => {
                const deptName = emp.departments?.name || 'Unknown'
                const bonusRange = BONUS_STRUCTURE[deptName] || { min: 10, max: 15 }
                const kpiScore = 85 // Mock data
                const bonusPercent = bonusRange.max
                const estimatedBonus = calculateBonus(emp.base_salary || 50000, kpiScore, bonusPercent)

                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold mr-3">
                          {emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{emp.full_name}</div>
                          <div className="text-sm text-gray-500">{emp.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deptName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-2">{kpiScore}%</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${kpiScore}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bonusRange.min}-{bonusRange.max}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${estimatedBonus}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        On Track
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Structure Reference */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Department Bonus Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(BONUS_STRUCTURE).map(([dept, range]) => (
            <div key={dept} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{dept}</p>
              <p className="text-2xl font-bold text-primary-600 mt-2">{range.min}-{range.max}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
