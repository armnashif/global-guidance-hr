import React, { useState, useEffect } from 'react'

const SKILLS = {
  technical: ['CRM Systems', 'Data Analysis', 'MS Office', 'Database Management', 'Reporting Tools'],
  soft: ['Communication', 'Leadership', 'Problem Solving', 'Time Management', 'Teamwork'],
  domain: ['Student Counseling', 'Visa Processing', 'Marketing Strategy', 'HR Policies', 'Business Development']
}

const PROFICIENCY_LEVELS = {
  5: { label: 'Expert', color: 'bg-green-500' },
  4: { label: 'Proficient', color: 'bg-blue-500' },
  3: { label: 'Intermediate', color: 'bg-yellow-500' },
  2: { label: 'Basic', color: 'bg-orange-500' },
  1: { label: 'None', color: 'bg-red-500' }
}

export default function SkillsMatrix({ supabase, currentUser }) {
  const [employees, setEmployees] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadSkillsData()
  }, [])

  const loadSkillsData = async () => {
    try {
      const { data: employeesData } = await supabase
        .from('employees')
        .select('employee_id, full_name, position, department_id')

      const { data: skillsData } = await supabase
        .from('employee_skills')
        .select('*')

      setEmployees(employeesData || [])
      setSkills(skillsData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading skills:', error)
      setLoading(false)
    }
  }

  const getSkillLevel = (employeeId, skillName) => {
    const skill = skills.find(s => s.employee_id === employeeId && s.skill_name === skillName)
    return skill?.proficiency_level || 1
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  const allSkills = selectedCategory === 'all' 
    ? [...SKILLS.technical, ...SKILLS.soft, ...SKILLS.domain]
    : SKILLS[selectedCategory] || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Skills & Competency Matrix</h1>
        <p className="text-gray-600 mt-2">Track employee skills and identify training needs</p>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-4">
          <CategoryButton label="All Skills" value="all" selected={selectedCategory} onClick={setSelectedCategory} />
          <CategoryButton label="Technical" value="technical" selected={selectedCategory} onClick={setSelectedCategory} />
          <CategoryButton label="Soft Skills" value="soft" selected={selectedCategory} onClick={setSelectedCategory} />
          <CategoryButton label="Domain Knowledge" value="domain" selected={selectedCategory} onClick={setSelectedCategory} />
        </div>
      </div>

      {/* Skills Heat Map */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                Employee
              </th>
              {allSkills.map((skill) => (
                <th key={skill} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {skill}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.employee_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                  <div>
                    <div className="font-medium text-gray-900">{employee.full_name}</div>
                    <div className="text-sm text-gray-500">{employee.position}</div>
                  </div>
                </td>
                {allSkills.map((skill) => {
                  const level = getSkillLevel(employee.employee_id, skill)
                  const proficiency = PROFICIENCY_LEVELS[level]
                  return (
                    <td key={skill} className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${proficiency.color}`}>
                        {proficiency.label}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Proficiency Levels</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(PROFICIENCY_LEVELS).reverse().map(([level, info]) => (
            <div key={level} className="flex items-center">
              <div className={`w-4 h-4 rounded-full ${info.color} mr-2`}></div>
              <span className="text-sm text-gray-700">{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryButton({ label, value, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        selected === value
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
