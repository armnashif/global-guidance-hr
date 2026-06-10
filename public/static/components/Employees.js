import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function Employees({ supabase, currentUser }) {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [searchTerm, selectedDepartment, employees])

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments (name)
        `)
        .order('employee_id')

      if (error) throw error
      setEmployees(data || [])
      setFilteredEmployees(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading employees:', error)
      setLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department_id === parseInt(selectedDepartment))
    }

    setFilteredEmployees(filtered)
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Employee Directory</h1>
          <p className="text-gray-600 mt-2">Manage your team members and their information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              <option value="1">Executive</option>
              <option value="2">Admin/HR</option>
              <option value="3">BD & Visa</option>
              <option value="4">Marketing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="all">All Modes</option>
              <option value="office">Office</option>
              <option value="wfh">Work From Home</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onClick={() => setSelectedEmployee(employee)}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-users text-gray-300 text-6xl mb-4"></i>
          <p className="text-gray-500 text-lg">No employees found</p>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          supabase={supabase}
        />
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          supabase={supabase}
          onSuccess={loadEmployees}
        />
      )}
    </div>
  )
}

function EmployeeCard({ employee, onClick }) {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {getInitials(employee.full_name)}
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-gray-800">{employee.full_name}</h3>
            <p className="text-sm text-gray-500">{employee.employee_id}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
          {employee.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <i className="fas fa-briefcase w-5"></i>
          <span className="ml-2">{employee.position}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-building w-5"></i>
          <span className="ml-2">{employee.departments?.name}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-envelope w-5"></i>
          <span className="ml-2 truncate">{employee.email}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-calendar w-5"></i>
          <span className="ml-2">Joined {format(new Date(employee.join_date), 'MMM yyyy')}</span>
        </div>
      </div>
    </div>
  )
}

function EmployeeDetailsModal({ employee, onClose, supabase }) {
  const [activeTab, setActiveTab] = useState('personal')

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: 'fa-user' },
    { id: 'contact', label: 'Contact', icon: 'fa-phone' },
    { id: 'employment', label: 'Employment', icon: 'fa-briefcase' },
    { id: 'compensation', label: 'Compensation', icon: 'fa-dollar-sign' },
    { id: 'documents', label: 'Documents', icon: 'fa-file' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold mr-4">
              {employee.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{employee.full_name}</h2>
              <p className="text-primary-100">{employee.position} • {employee.employee_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-4 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'personal' && (
            <PersonalInfoTab employee={employee} />
          )}
          {activeTab === 'contact' && (
            <ContactInfoTab employee={employee} />
          )}
          {activeTab === 'employment' && (
            <EmploymentInfoTab employee={employee} />
          )}
          {activeTab === 'compensation' && (
            <CompensationInfoTab employee={employee} />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab employee={employee} supabase={supabase} />
          )}
        </div>
      </div>
    </div>
  )
}

function PersonalInfoTab({ employee }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoField label="Full Name" value={employee.full_name} />
      <InfoField label="Employee ID" value={employee.employee_id} />
      <InfoField label="Date of Birth" value={employee.date_of_birth ? format(new Date(employee.date_of_birth), 'MMM dd, yyyy') : 'N/A'} />
      <InfoField label="Gender" value={employee.gender || 'N/A'} />
      <InfoField label="Nationality" value={employee.nationality || 'N/A'} />
      <InfoField label="Marital Status" value={employee.marital_status || 'N/A'} />
      <InfoField label="Blood Type" value={employee.blood_type || 'N/A'} />
      <InfoField label="National ID" value={employee.national_id || 'N/A'} />
    </div>
  )
}

function ContactInfoTab({ employee }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <InfoField label="Email" value={employee.email} />
          <InfoField label="Phone" value={employee.phone || 'N/A'} />
          <InfoField label="Work Mode" value={employee.work_mode || 'N/A'} />
          <InfoField label="Address" value={employee.address || 'N/A'} className="col-span-2" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-6">
          <InfoField label="Emergency Contact Name" value={employee.emergency_contact_name || 'N/A'} />
          <InfoField label="Emergency Contact Phone" value={employee.emergency_contact_phone || 'N/A'} />
          <InfoField label="Relationship" value={employee.emergency_contact_relationship || 'N/A'} />
        </div>
      </div>
    </div>
  )
}

function EmploymentInfoTab({ employee }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoField label="Position" value={employee.position} />
      <InfoField label="Department" value={employee.departments?.name} />
      <InfoField label="Join Date" value={format(new Date(employee.join_date), 'MMM dd, yyyy')} />
      <InfoField label="Employment Type" value={employee.employment_type || 'Full-time'} />
      <InfoField label="Reports To" value={employee.reports_to_id || 'N/A'} />
      <InfoField label="Status" value={employee.status} />
    </div>
  )
}

function CompensationInfoTab({ employee }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <InfoField label="Base Salary" value={employee.base_salary ? `$${employee.base_salary.toLocaleString()}` : 'N/A'} />
      <InfoField label="Salary Band" value={employee.salary_band || 'N/A'} />
      <InfoField label="Bank Name" value={employee.bank_name || 'N/A'} />
      <InfoField label="Account Number" value={employee.account_number || 'N/A'} />
      <InfoField label="Tax ID" value={employee.tax_id || 'N/A'} />
    </div>
  )
}

function DocumentsTab({ employee, supabase }) {
  return (
    <div>
      <p className="text-gray-600 mb-4">Employee documents and files</p>
      <div className="space-y-2">
        <DocumentItem name="Employment Contract" date="Jan 15, 2020" />
        <DocumentItem name="Personal Information Form" date="Jan 15, 2020" />
        <DocumentItem name="ID Copy" date="Jan 15, 2020" />
      </div>
    </div>
  )
}

function DocumentItem({ name, date }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
      <div className="flex items-center">
        <i className="fas fa-file-pdf text-red-500 text-xl mr-3"></i>
        <div>
          <p className="font-medium text-gray-800">{name}</p>
          <p className="text-sm text-gray-500">Uploaded {date}</p>
        </div>
      </div>
      <button className="text-primary-600 hover:text-primary-700">
        <i className="fas fa-download"></i>
      </button>
    </div>
  )
}

function InfoField({ label, value, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <p className="text-gray-800">{value}</p>
    </div>
  )
}

function AddEmployeeModal({ onClose, supabase, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Employee</h2>
        <p className="text-gray-600 mb-4">This feature will be implemented with form validation</p>
        <button
          onClick={onClose}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}
