// ============================================================
// SIDEBAR
// ============================================================
const sidebarButton = document.querySelector('.panel-button')
const sidebar = document.querySelector('.sidebar')
const mainScreen = document.querySelector('.main')

const toggleSidebar = function () {
  sidebar.classList.toggle('hide')
  mainScreen.classList.toggle('shrink')
}
sidebarButton.addEventListener('click', () => toggleSidebar())

// ============================================================
// TABS
// ============================================================
const projectsButton = document.querySelector('.menu-btn.projects')
const employeesButton = document.querySelector('.menu-btn.employees')
const projectsScreen = document.querySelector('.projects-screen')
const employeesScreen = document.querySelector('.employees-screen')

function switchTab(tab) {
  if (tab === 'employees') {
    projectsScreen.classList.add('hidden')
    employeesScreen.classList.remove('hidden')
    employeesButton.classList.add('active')
    projectsButton.classList.remove('active')
  } else {
    employeesScreen.classList.add('hidden')
    projectsScreen.classList.remove('hidden')
    projectsButton.classList.add('active')
    employeesButton.classList.remove('active')
  }
  localStorage.setItem('activeTab', tab)
}

employeesButton.addEventListener('click', () => switchTab('employees'))
projectsButton.addEventListener('click', () => switchTab('projects'))

const savedTab = localStorage.getItem('activeTab')
if (savedTab) switchTab(savedTab)

// ============================================================
// PERIOD
// ============================================================
const now = new Date()
const monthSelect = document.getElementById('month')
const yearSelect = document.getElementById('year')
const title1 = document.getElementById('date-output-projects')
const title2 = document.getElementById('date-output-employees')

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const savedPeriod = localStorage.getItem('selectedPeriod')
if (savedPeriod) {
  const [savedYear, savedMonth] = savedPeriod.split('-')
  yearSelect.value = savedYear
  monthSelect.value = savedMonth
} else {
  monthSelect.value = now.getMonth()
  yearSelect.value = now.getFullYear()
}

function updateDate() {
  const monthIndex = Number(monthSelect.value)
  const year = yearSelect.value
  const text = `${months[monthIndex]} ${year}`
  title1.textContent = text
  title2.textContent = text
}

monthSelect.addEventListener('change', () => {
  updateDate()
  changePeriod(yearSelect.value, monthSelect.value)
})
yearSelect.addEventListener('change', () => {
  updateDate()
  changePeriod(yearSelect.value, monthSelect.value)
})
updateDate()

// ============================================================
// DATA
// ============================================================
const stored = localStorage.getItem('monthlyData')
const data = { monthlyData: stored ? JSON.parse(stored) : {} }

function saveData() {
  localStorage.setItem('monthlyData', JSON.stringify(data.monthlyData))
}

let currentPeriod = savedPeriod || `${now.getFullYear()}-${now.getMonth()}`

function ensurePeriodExists() {
  if (!data.monthlyData[currentPeriod]) {
    data.monthlyData[currentPeriod] = { projects: [], employees: [] }
  }
}

function changePeriod(year, monthIndex) {
  currentPeriod = `${year}-${monthIndex}`
  localStorage.setItem('selectedPeriod', currentPeriod)
  renderProjects()
  renderEmployees()
}

// ============================================================
// CALCULATIONS
// ============================================================

// effective capacity for one assignment
function calcEffectiveCapacity(employee, assignment) {
  return assignment.capacity * assignment.fit
}

// total used effective capacity on a project
function calcProjectUsedEffCapacity(project, employees) {
  let total = 0
  employees.forEach((emp) => {
    const asgn = emp.assignments?.[project.id]
    if (asgn) total += calcEffectiveCapacity(emp, asgn)
  })
  return total
}

// revenue for one employee on one project
function calcEmployeeRevenue(employee, project, employees) {
  const asgn = employee.assignments?.[project.id]
  if (!asgn) return 0
  const usedEffCap = calcProjectUsedEffCapacity(project, employees)
  const capForRevenue = Math.max(project.capacity, usedEffCap)
  if (capForRevenue === 0) return 0
  const revenuePerEffCap = project.budget / capForRevenue
  return revenuePerEffCap * calcEffectiveCapacity(employee, asgn)
}

// cost for one employee on one project
function calcEmployeeCost(employee, projectId) {
  const asgn = employee.assignments?.[projectId]
  if (!asgn) return 0
  return employee.salary * Math.max(0.5, asgn.capacity)
}

// total estimated payment for an employee (all assignments)
function calcEstimatedPayment(employee) {
  const period = data.monthlyData[currentPeriod]
  if (!period) return employee.salary * 0.5

  const assignmentIds = Object.keys(employee.assignments || {})
  if (assignmentIds.length === 0) return employee.salary * 0.5

  // only count assignments for projects that exist in this period
  const existingProjectIds = new Set(period.projects.map((p) => p.id))
  const activeIds = assignmentIds.filter((id) => existingProjectIds.has(id))
  if (activeIds.length === 0) return employee.salary * 0.5

  return activeIds.reduce((sum, pid) => {
    const asgn = employee.assignments[pid]
    return sum + employee.salary * Math.max(0.5, asgn.capacity)
  }, 0)
}

// total projected income (profit) for an employee
function calcProjectedIncome(employee) {
  const period = data.monthlyData[currentPeriod]
  if (!period) return 0

  const existingProjectIds = new Set(period.projects.map((p) => p.id))
  let total = 0
  Object.keys(employee.assignments || {}).forEach((pid) => {
    if (!existingProjectIds.has(pid)) return
    const project = period.projects.find((p) => p.id === pid)
    if (!project) return
    const rev = calcEmployeeRevenue(employee, project, period.employees)
    const cost = calcEmployeeCost(employee, pid)
    total += rev - cost
  })
  return total
}

// total used capacity on a project (sum of assigned capacities)
function calcProjectUsedCapacity(projectId, employees) {
  return employees.reduce((sum, emp) => {
    const asgn = emp.assignments?.[projectId]
    return asgn ? sum + asgn.capacity : sum
  }, 0)
}

// total revenue, cost, profit for a project
function calcProjectFinancials(project, employees) {
  let totalRevenue = 0
  let totalCost = 0
  employees.forEach((emp) => {
    const asgn = emp.assignments?.[project.id]
    if (!asgn) return
    totalRevenue += calcEmployeeRevenue(emp, project, employees)
    totalCost += calcEmployeeCost(emp, project.id)
  })
  return {
    revenue: totalRevenue,
    cost: totalCost,
    profit: totalRevenue - totalCost,
  }
}

function fmt(n) {
  return '$' + Number(n).toFixed(2)
}

// ============================================================
// PROJECT PANEL (add)
// ============================================================
const panel = document.getElementById('projectPanel')
const overlay = document.getElementById('overlay')
const openBtn = document.querySelector('.add-btn.projects')
const closeBtn = document.getElementById('closePanel')
const cancelBtn = document.getElementById('cancelBtn')

openBtn.onclick = () => {
  panel.classList.add('active')
  overlay.classList.add('active')
}
function closePanel() {
  panel.classList.remove('active')
  overlay.classList.remove('active')
}
closeBtn.onclick = closePanel
cancelBtn.onclick = closePanel

const form = document.getElementById('projectForm')
const submitBtn = document.getElementById('submitBtn')
submitBtn.onclick = closePanel

const fields = {
  projectName: {
    el: document.getElementById('projectName'),
    validate: (v) => /^[a-z0-9 ]{3,}$/i.test(v),
    msg: 'Min 3 chars, letters & numbers',
  },
  companyName: {
    el: document.getElementById('companyName'),
    validate: (v) => /^[a-z0-9 ]{2,}$/i.test(v),
    msg: 'Min 2 chars',
  },
  budget: {
    el: document.getElementById('budget'),
    validate: (v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0,
    msg: 'Positive number (2 decimals)',
  },
  capacity: {
    el: document.getElementById('capacity'),
    validate: (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
    msg: 'Integer ≥ 1',
  },
}

function checkField(field) {
  const value = field.el.value.trim()
  const error = field.el.nextElementSibling
  if (!field.validate(value)) {
    error.textContent = field.msg
    return false
  }
  error.textContent = ''
  return true
}
function checkForm() {
  submitBtn.disabled = !Object.values(fields).every(checkField)
}
Object.values(fields).forEach((field) => {
  field.el.addEventListener('input', () => {
    checkField(field)
    checkForm()
  })
  field.el.addEventListener('blur', () => checkField(field))
})
form.addEventListener('submit', (e) => e.preventDefault())

document.getElementById('projectForm').addEventListener('submit', (e) => {
  e.preventDefault()
  ensurePeriodExists()
  const newProject = {
    id: crypto.randomUUID(),
    companyName: document.getElementById('companyName').value,
    projectName: document.getElementById('projectName').value,
    budget: Number(document.getElementById('budget').value),
    capacity: Number(document.getElementById('capacity').value),
  }
  data.monthlyData[currentPeriod].projects.push(newProject)
  saveData()
  renderProjects()
})

// ============================================================
// EMPLOYEE PANEL (add)
// ============================================================
const empPanel = document.getElementById('employeePanel')
const openEmpBtn = document.querySelector('.add-btn.employees')
const closeEmpBtn = document.getElementById('closeEmployeePanel')
const cancelEmpBtn = document.getElementById('cancelEmployeeBtn')

openEmpBtn.onclick = () => {
  empPanel.classList.add('active')
  overlay.classList.add('active')
}
function closeEmployeePanel() {
  empPanel.classList.remove('active')
  overlay.classList.remove('active')
}
closeEmpBtn.onclick = closeEmployeePanel
cancelEmpBtn.onclick = closeEmployeePanel

overlay.onclick = () => {
  closePanel()
  closeEmployeePanel()
}

const empForm = document.getElementById('employeeForm')
const empSubmit = document.getElementById('submitEmployeeBtn')
empSubmit.onclick = closeEmployeePanel

const empFields = {
  name: {
    el: document.getElementById('empName'),
    validate: (v) => /^[a-zа-яё]{3,}$/i.test(v),
    msg: 'Min 3 letters only',
  },
  surname: {
    el: document.getElementById('empSurname'),
    validate: (v) => /^[a-zа-яё]{3,}$/i.test(v),
    msg: 'Min 3 letters only',
  },
  dob: {
    el: document.getElementById('empDob'),
    validate: (v) => {
      if (!v) return false
      const age = new Date().getFullYear() - new Date(v).getFullYear()
      return age >= 18
    },
    msg: 'Must be 18+ years old',
  },
  position: {
    el: document.getElementById('empPosition'),
    validate: (v) => v !== '',
    msg: 'Select a position',
  },
  salary: {
    el: document.getElementById('empSalary'),
    validate: (v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0,
    msg: 'Positive number (2 decimals)',
  },
}

function checkEmpField(field) {
  const value = field.el.value.trim()
  const error = field.el.nextElementSibling
  if (!field.validate(value)) {
    error.textContent = field.msg
    return false
  }
  error.textContent = ''
  return true
}
function checkEmpForm() {
  empSubmit.disabled = !Object.values(empFields).every(checkEmpField)
}
Object.values(empFields).forEach((field) => {
  field.el.addEventListener('input', () => {
    checkEmpField(field)
    checkEmpForm()
  })
  field.el.addEventListener('blur', () => checkEmpField(field))
})
empForm.addEventListener('submit', (e) => e.preventDefault())

document.getElementById('employeeForm').addEventListener('submit', (e) => {
  e.preventDefault()
  ensurePeriodExists()
  const dob = new Date(document.getElementById('empDob').value)
  const age = now.getFullYear() - dob.getFullYear()
  const newEmployee = {
    id: crypto.randomUUID(),
    name: document.getElementById('empName').value,
    surname: document.getElementById('empSurname').value,
    dob: document.getElementById('empDob').value,
    age,
    position: document.getElementById('empPosition').value,
    salary: Number(document.getElementById('empSalary').value),
    assignments: {},
    vacations: {},
  }
  data.monthlyData[currentPeriod].employees.push(newEmployee)
  saveData()
  renderEmployees()
})

// ============================================================
// FILTERING
// ============================================================
const activeFilters = {
  projects: {},
  employees: {},
}

function applyFilter(tableType, field, value) {
  if (value === '' || value === null) {
    delete activeFilters[tableType][field]
  } else {
    activeFilters[tableType][field] = value
  }
  renderFilterChips(tableType)
  if (tableType === 'projects') renderProjects()
  else renderEmployees()
}

function clearAllFilters(tableType) {
  activeFilters[tableType] = {}
  renderFilterChips(tableType)
  if (tableType === 'projects') renderProjects()
  else renderEmployees()
}

function getFilteredArray(arr, tableType) {
  const filters = activeFilters[tableType]
  if (Object.keys(filters).length === 0) return arr
  return arr.filter((item) => {
    return Object.entries(filters).every(([field, value]) => {
      const itemVal = String(item[field] || '').toLowerCase()
      return itemVal.includes(value.toLowerCase())
    })
  })
}

function renderFilterChips(tableType) {
  const chipsEl = document.getElementById(
    tableType === 'projects' ? 'projectFilterChips' : 'employeeFilterChips',
  )
  if (!chipsEl) return

  const filters = activeFilters[tableType]
  const entries = Object.entries(filters)
  chipsEl.innerHTML = ''

  if (entries.length === 0) return

  entries.forEach(([field, value]) => {
    const label =
      document.querySelector(
        `.filter-icon[data-table="${tableType}"][data-field="${field}"]`,
      )?.dataset.label || field
    const chip = document.createElement('span')
    chip.className = 'filter-chip'
    chip.innerHTML = `${label}: <strong>${value}</strong> <span class="chip-remove" data-table="${tableType}" data-field="${field}">×</span>`
    chipsEl.appendChild(chip)
  })

  if (entries.length >= 2) {
    const clearChip = document.createElement('span')
    clearChip.className = 'filter-chip filter-chip-clear'
    clearChip.textContent = 'Clear Filters'
    clearChip.addEventListener('click', () => clearAllFilters(tableType))
    chipsEl.appendChild(clearChip)
  }
}

// chip remove click
document.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.chip-remove')
  if (!removeBtn) return
  applyFilter(removeBtn.dataset.table, removeBtn.dataset.field, '')
})

// filter popup
let activeFilterPopup = null

function openFilterPopup(icon) {
  closeFilterPopup()

  const tableType = icon.dataset.table
  const field = icon.dataset.field
  const label = icon.dataset.label
  const isDropdown = icon.dataset.type === 'dropdown'
  const currentValue = activeFilters[tableType][field] || ''

  const popup = document.createElement('div')
  popup.id = 'filterPopup'
  popup.className = 'filter-popup'

  if (isDropdown) {
    const positions = ['Junior', 'Middle', 'Senior', 'Lead', 'Architect', 'BO']
    const options = positions
      .map(
        (p) =>
          `<option value="${p}" ${currentValue === p ? 'selected' : ''}>${p}</option>`,
      )
      .join('')
    popup.innerHTML = `
      <div class="filter-popup-header"><strong>${label}</strong></div>
      <select id="filterDropdown" class="inline-select" style="width:100%">
        <option value="">All</option>
        ${options}
      </select>
    `
  } else {
    popup.innerHTML = `
      <div class="filter-popup-header"><strong>${label}</strong></div>
      <input type="text" id="filterInput" class="inline-input" placeholder="Filter..." value="${currentValue}" style="width:100%" />
      <div class="filter-popup-actions">
        <button class="cancel-btn" id="cancelFilterBtn" style="flex:1;padding:6px">Cancel</button>
        <button class="submit-btn" id="applyFilterBtn" style="flex:1;padding:6px">Apply</button>
      </div>
    `
  }

  document.body.appendChild(popup)
  activeFilterPopup = popup

  // position near icon
  const rect = icon.getBoundingClientRect()
  const popupW = 200
  let left = rect.left
  let top = rect.bottom + 6
  if (left + popupW > window.innerWidth - 8)
    left = window.innerWidth - popupW - 8
  popup.style.cssText = `position:fixed;top:${top}px;left:${left}px;width:${popupW}px;z-index:250`

  if (isDropdown) {
    const sel = popup.querySelector('#filterDropdown')
    sel.focus()
    sel.addEventListener('change', () => {
      applyFilter(tableType, field, sel.value)
      closeFilterPopup()
    })
  } else {
    const input = popup.querySelector('#filterInput')
    input.focus()
    input.select()
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        applyFilter(tableType, field, input.value.trim())
        closeFilterPopup()
      }
      if (e.key === 'Escape') closeFilterPopup()
    })
    popup.querySelector('#applyFilterBtn').addEventListener('click', () => {
      applyFilter(tableType, field, input.value.trim())
      closeFilterPopup()
    })
    popup
      .querySelector('#cancelFilterBtn')
      .addEventListener('click', closeFilterPopup)
  }

  setTimeout(() => {
    document.addEventListener('click', filterOutsideHandler)
  }, 0)
}

function filterOutsideHandler(e) {
  const popup = document.getElementById('filterPopup')
  if (popup && !popup.contains(e.target) && !e.target.closest('.filter-icon')) {
    closeFilterPopup()
  }
}

function closeFilterPopup() {
  const popup = document.getElementById('filterPopup')
  if (popup) popup.remove()
  document.removeEventListener('click', filterOutsideHandler)
  activeFilterPopup = null
}

// filter icon click
document.addEventListener('click', (e) => {
  const icon = e.target.closest('.filter-icon')
  if (!icon) return
  e.stopPropagation()
  if (activeFilterPopup) {
    closeFilterPopup()
    return
  }
  openFilterPopup(icon)
})

// ============================================================
// SORTING
// ============================================================
const sortState = {
  projects: { field: null, dir: 1 },
  employees: { field: null, dir: 1 },
}

function getSortedArray(arr, field, dir) {
  if (!field) return arr
  return [...arr].sort((a, b) => {
    const valA = a[field]
    const valB = b[field]
    if (typeof valA === 'string') return valA.localeCompare(valB) * dir
    return (valA - valB) * dir
  })
}

function updateSortIcons(tableType) {
  const { field, dir } = sortState[tableType]
  document
    .querySelectorAll(`.sort-icon[data-table="${tableType}"]`)
    .forEach((icon) => {
      if (icon.dataset.field === field) {
        icon.textContent = dir === 1 ? '↑' : '↓'
        icon.classList.add('sort-active')
      } else {
        icon.textContent = '⇅'
        icon.classList.remove('sort-active')
      }
    })
}

document.addEventListener('click', (e) => {
  const icon = e.target.closest('.sort-icon')
  if (!icon) return
  const tableType = icon.dataset.table
  const field = icon.dataset.field
  const state = sortState[tableType]
  if (state.field === field) state.dir *= -1
  else {
    state.field = field
    state.dir = 1
  }
  if (tableType === 'projects') renderProjects()
  else renderEmployees()
})

// ============================================================
// RENDER PROJECTS
// ============================================================
const projectsTbody = document.querySelector('.projects tbody')

function renderProjects() {
  const period = data.monthlyData[currentPeriod]
  projectsTbody.innerHTML = ''

  if (!period || period.projects.length === 0) {
    projectsTbody.innerHTML = `<tr class="empty"><td colspan="7">No projects found</td></tr>`
    updateTotalIncome()
    updateSortIcons('projects')
    renderFilterChips('projects')
    return
  }

  const { field, dir } = sortState.projects
  const filtered = getFilteredArray(period.projects, 'projects')
  const sorted = getSortedArray(filtered, field, dir)

  sorted.forEach((p) => {
    const originalIndex = period.projects.indexOf(p)
    const { profit } = calcProjectFinancials(p, period.employees)
    const usedCap = calcProjectUsedCapacity(p.id, period.employees)
    const empOnProject = period.employees.filter((e) => e.assignments?.[p.id])

    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${p.companyName}</td>
      <td>${p.projectName}</td>
      <td>${fmt(p.budget)}</td>
      <td>${usedCap.toFixed(1)}/${p.capacity}</td>
      <td class="${profit >= 0 ? 'positive' : 'negative'}">${fmt(profit)}</td>
      <td>
        <button class="action-btn show-employees-btn" data-project-id="${p.id}">
          Show Employees (${empOnProject.length})
        </button>
      </td>
      <td>
        <button class="action-btn delete-btn" data-index="${originalIndex}" data-type="project">Delete</button>
      </td>
    `
    projectsTbody.appendChild(row)
  })

  updateTotalIncome()
  updateSortIcons('projects')
}

// ============================================================
// RENDER EMPLOYEES
// ============================================================
const employeesTbody = document.querySelector('.employees tbody')

function renderEmployees() {
  const period = data.monthlyData[currentPeriod]
  employeesTbody.innerHTML = ''

  if (!period || period.employees.length === 0) {
    employeesTbody.innerHTML = `<tr class="empty"><td colspan="9">No employees found</td></tr>`
    updateSortIcons('employees')
    renderFilterChips('employees')
    return
  }

  const positions = ['Junior', 'Middle', 'Senior', 'Lead', 'Architect', 'BO']
  const { field, dir } = sortState.employees
  const filtered = getFilteredArray(period.employees, 'employees')
  const sorted = getSortedArray(filtered, field, dir)

  sorted.forEach((e) => {
    const originalIndex = period.employees.indexOf(e)
    const positionOptions = positions
      .map(
        (pos) =>
          `<option value="${pos}" ${pos === e.position ? 'selected' : ''}>${pos}</option>`,
      )
      .join('')

    const estimatedPayment = calcEstimatedPayment(e)
    const projectedIncome = calcProjectedIncome(e)

    // assignment count and total capacity
    const existingProjectIds = new Set(period.projects.map((p) => p.id))
    const activeAssignments = Object.entries(e.assignments || {}).filter(
      ([pid]) => existingProjectIds.has(pid),
    )
    const totalAssignedCap = activeAssignments.reduce(
      (sum, [, asgn]) => sum + asgn.capacity,
      0,
    )
    const assignCount = activeAssignments.length
    const canAssign = totalAssignedCap < 1.5

    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${e.name}</td>
      <td>${e.surname}</td>
      <td>${e.age}</td>
      <td class="editable-cell" data-field="position" data-index="${originalIndex}">
        <span class="cell-view">${e.position}</span>
        <span class="cell-edit hidden">
          <select class="inline-select">${positionOptions}</select>
          <button class="ok-btn">OK</button>
        </span>
      </td>
      <td class="editable-cell" data-field="salary" data-index="${originalIndex}">
        <span class="cell-view">${fmt(e.salary)}</span>
        <span class="cell-edit hidden">
          <input type="number" step="0.01" class="inline-input" value="${e.salary}" min="0.01" />
          <button class="ok-btn">OK</button>
        </span>
      </td>
      <td>${fmt(estimatedPayment)}</td>
      <td>
        <button class="action-btn show-assignments-btn" data-employee-id="${e.id}">
          Show Assignments (${assignCount}) ${totalAssignedCap.toFixed(1)}/1.5
        </button>
      </td>
      <td class="${projectedIncome >= 0 ? 'positive' : 'negative'}">${fmt(projectedIncome)}</td>
      <td class="actions-cell">
        <button class="action-btn assign-btn" data-employee-id="${e.id}" ${!canAssign ? 'disabled title="Max capacity reached"' : ''}>Assign</button>
        <button class="action-btn delete-btn" data-index="${originalIndex}" data-type="employee">Delete</button>
      </td>
    `
    employeesTbody.appendChild(row)
  })

  updateSortIcons('employees')
}

// ============================================================
// TOTAL INCOME
// ============================================================
function updateTotalIncome() {
  const totalEl = document.querySelector('.total .money')
  if (!totalEl) return
  const period = data.monthlyData[currentPeriod]
  if (!period) {
    totalEl.textContent = '$0.00'
    return
  }
  const total = period.projects.reduce((sum, p) => {
    return sum + calcProjectFinancials(p, period.employees).profit
  }, 0)
  totalEl.textContent = fmt(total)
  totalEl.className = 'money ' + (total >= 0 ? 'positive' : 'negative')
}

// ============================================================
// DELETE (projects table)
// ============================================================
document
  .querySelector('.table-wrapper.projects')
  .addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) {
      const btn = e.target.closest('.delete-btn')
      if (btn.dataset.type !== 'project') return
      const index = Number(btn.dataset.index)
      const projectId = data.monthlyData[currentPeriod].projects[index].id
      // unassign all employees from this project
      data.monthlyData[currentPeriod].employees.forEach((emp) => {
        if (emp.assignments?.[projectId]) delete emp.assignments[projectId]
      })
      data.monthlyData[currentPeriod].projects.splice(index, 1)
      saveData()
      renderProjects()
      renderEmployees()
      return
    }

    if (e.target.closest('.show-employees-btn')) {
      const btn = e.target.closest('.show-employees-btn')
      openShowEmployeesPopup(btn.dataset.projectId)
    }
  })

// ============================================================
// DELETE + INLINE EDIT + ASSIGN (employees table)
// ============================================================
document
  .querySelector('.table-wrapper.employees')
  .addEventListener('click', (e) => {
    // delete
    if (e.target.closest('.delete-btn')) {
      const btn = e.target.closest('.delete-btn')
      if (btn.dataset.type !== 'employee') return
      const index = Number(btn.dataset.index)
      data.monthlyData[currentPeriod].employees.splice(index, 1)
      saveData()
      renderEmployees()
      renderProjects()
      return
    }

    // assign button
    if (e.target.closest('.assign-btn')) {
      const btn = e.target.closest('.assign-btn')
      openAssignPopup(btn.dataset.employeeId, btn)
      return
    }

    // show Assignments
    if (e.target.closest('.show-assignments-btn')) {
      const btn = e.target.closest('.show-assignments-btn')
      openShowAssignmentsPopup(btn.dataset.employeeId)
      return
    }

    // inline edit open
    const cell = e.target.closest('.editable-cell')
    if (cell && !e.target.closest('.cell-edit')) {
      const cellView = cell.querySelector('.cell-view')
      const cellEdit = cell.querySelector('.cell-edit')
      cellView.classList.add('hidden')
      cellEdit.classList.remove('hidden')
      const input = cellEdit.querySelector('input, select')
      if (input) input.focus()
      return
    }

    // inline edit OK
    if (e.target.closest('.ok-btn')) {
      const cell = e.target.closest('.editable-cell')
      const index = Number(cell.dataset.index)
      const field = cell.dataset.field
      const input = cell.querySelector('input, select')
      const value = input.value.trim()

      if (field === 'salary') {
        const num = Number(value)
        if (!value || isNaN(num) || num <= 0) {
          input.style.borderColor = '#ef4444'
          return
        }
        input.style.borderColor = ''
        data.monthlyData[currentPeriod].employees[index].salary = num
      } else if (field === 'position') {
        data.monthlyData[currentPeriod].employees[index].position = value
      }
      saveData()
      renderEmployees()
      renderProjects()
    }
  })

// ============================================================
// ASSIGN POPUP
// ============================================================
let assignPopupScrollHandler = null
let assignPopupResizeHandler = null

function openAssignPopup(employeeId, triggerBtn) {
  closeAssignPopup()

  const period = data.monthlyData[currentPeriod]
  if (!period) return

  const employee = period.employees.find((e) => e.id === employeeId)
  if (!employee) return

  // filter projects that this employee is not already assigned to
  const existingProjectIds = new Set(Object.keys(employee.assignments || {}))
  const availableProjects = period.projects.filter(
    (p) => !existingProjectIds.has(p.id),
  )

  const totalAssignedCap = Object.entries(employee.assignments || {})
    .filter(([pid]) => period.projects.find((p) => p.id === pid))
    .reduce((sum, [, asgn]) => sum + asgn.capacity, 0)

  const availableCap = Math.max(0, 1.5 - totalAssignedCap)

  const popup = document.createElement('div')
  popup.id = 'assignPopup'
  popup.className = 'assign-popup'

  const projectOptions =
    availableProjects.length === 0
      ? `<option value="">No available projects</option>`
      : availableProjects
          .map((p) => {
            const used = calcProjectUsedCapacity(p.id, period.employees)
            return `<option value="${p.id}">${p.projectName} (${used.toFixed(1)}/${p.capacity})</option>`
          })
          .join('')

  popup.innerHTML = `
    <div class="assign-popup-header">
      <strong>Assign ${employee.name} ${employee.surname}</strong>
      <button class="close-btn" id="closeAssignPopup">×</button>
    </div>
    <div class="assign-popup-info">
      Current capacity: <span>${totalAssignedCap.toFixed(1)}/1.5</span> &nbsp;|&nbsp; Available: <span>${availableCap.toFixed(1)}</span>
    </div>
    <div class="form-group">
      <label>Project</label>
      <select id="assignProjectSelect" class="inline-select" style="width:100%">${projectOptions}</select>
    </div>
    <div class="form-group">
      <label>Capacity: <span id="assignCapVal">0.5</span></label>
      <input type="range" id="assignCapSlider" min="0" max="1.5" step="0.1" value="0.5" style="width:100%" />
    </div>
    <div class="form-group">
      <label>Project Fit: <span id="assignFitVal">1.0</span></label>
      <input type="range" id="assignFitSlider" min="0" max="1.0" step="0.1" value="1.0" style="width:100%" />
    </div>
    <div class="assign-popup-calc" id="assignCalcInfo"></div>
    <div class="assign-popup-warning" id="assignWarning"></div>
    <div class="panel-actions" style="margin-top:12px">
      <button class="cancel-btn" id="cancelAssignBtn">Cancel</button>
      <button class="submit-btn" id="confirmAssignBtn" ${availableProjects.length === 0 ? 'disabled' : ''}>Assign</button>
    </div>
  `

  document.body.appendChild(popup)
  positionPopup(popup, triggerBtn)

  // live calc update
  function updateAssignCalc() {
    const cap = Number(document.getElementById('assignCapSlider').value)
    const fit = Number(document.getElementById('assignFitSlider').value)
    const projectId = document.getElementById('assignProjectSelect').value
    const project = period.projects.find((p) => p.id === projectId)

    document.getElementById('assignCapVal').textContent = cap.toFixed(1)
    document.getElementById('assignFitVal').textContent = fit.toFixed(1)

    const effCap = cap * fit
    const newTotal = totalAssignedCap + cap
    const calcEl = document.getElementById('assignCalcInfo')
    calcEl.innerHTML = `Effective capacity: <strong>${effCap.toFixed(2)}</strong> &nbsp;|&nbsp; New total: <strong>${newTotal.toFixed(1)}/1.5</strong>`

    const warnEl = document.getElementById('assignWarning')
    const confirmBtn = document.getElementById('confirmAssignBtn')

    if (newTotal > 1.5) {
      warnEl.textContent = '⚠ Employee capacity limit (1.5) will be exceeded'
      confirmBtn.disabled = true
    } else if (project) {
      const usedEffCap = calcProjectUsedEffCapacity(project, period.employees)
      if (usedEffCap + effCap > project.capacity) {
        warnEl.textContent = `⚠ Project capacity (${project.capacity}) will be exceeded (${(usedEffCap + effCap).toFixed(2)})`
        confirmBtn.disabled = false
      } else {
        warnEl.textContent = ''
        confirmBtn.disabled = false
      }
    } else {
      warnEl.textContent = ''
    }
  }

  document
    .getElementById('assignCapSlider')
    .addEventListener('input', updateAssignCalc)
  document
    .getElementById('assignFitSlider')
    .addEventListener('input', updateAssignCalc)
  document
    .getElementById('assignProjectSelect')
    .addEventListener('change', updateAssignCalc)
  updateAssignCalc()

  document.getElementById('closeAssignPopup').onclick = closeAssignPopup
  document.getElementById('cancelAssignBtn').onclick = closeAssignPopup

  document.getElementById('confirmAssignBtn').onclick = () => {
    const projectId = document.getElementById('assignProjectSelect').value
    if (!projectId) return
    const cap = Number(document.getElementById('assignCapSlider').value)
    const fit = Number(document.getElementById('assignFitSlider').value)

    const emp = period.employees.find((e) => e.id === employeeId)
    emp.assignments[projectId] = { capacity: cap, fit }
    saveData()
    closeAssignPopup()
    renderEmployees()
    renderProjects()
  }

  // position update on scroll/resize
  assignPopupScrollHandler = () => positionPopup(popup, triggerBtn)
  assignPopupResizeHandler = () => positionPopup(popup, triggerBtn)
  window.addEventListener('scroll', assignPopupScrollHandler, true)
  window.addEventListener('resize', assignPopupResizeHandler)

  // close on outside click
  setTimeout(() => {
    document.addEventListener('click', assignOutsideHandler)
  }, 0)
}

function assignOutsideHandler(e) {
  const popup = document.getElementById('assignPopup')
  if (popup && !popup.contains(e.target)) closeAssignPopup()
}

function closeAssignPopup() {
  const popup = document.getElementById('assignPopup')
  if (popup) popup.remove()
  if (assignPopupScrollHandler)
    window.removeEventListener('scroll', assignPopupScrollHandler, true)
  if (assignPopupResizeHandler)
    window.removeEventListener('resize', assignPopupResizeHandler)
  document.removeEventListener('click', assignOutsideHandler)
}

function positionPopup(popup, triggerBtn) {
  const rect = triggerBtn.getBoundingClientRect()
  const popupW = 320
  const popupH = popup.offsetHeight || 360
  const margin = 8

  let top = rect.bottom + margin
  let left = rect.left

  if (left + popupW > window.innerWidth - margin)
    left = window.innerWidth - popupW - margin
  if (left < margin) left = margin
  if (top + popupH > window.innerHeight - margin)
    top = rect.top - popupH - margin
  if (top < margin) top = margin

  popup.style.position = 'fixed'
  popup.style.top = top + 'px'
  popup.style.left = left + 'px'
  popup.style.width = popupW + 'px'
  popup.style.zIndex = 200
}

// ============================================================
// SHOW ASSIGNMENTS POPUP (employee → projects)
// ============================================================
function openShowAssignmentsPopup(employeeId) {
  const period = data.monthlyData[currentPeriod]
  if (!period) return
  const employee = period.employees.find((e) => e.id === employeeId)
  if (!employee) return

  const existingProjectIds = new Set(period.projects.map((p) => p.id))
  const activeAssignments = Object.entries(employee.assignments || {}).filter(
    ([pid]) => existingProjectIds.has(pid),
  )

  let rows = ''
  if (activeAssignments.length === 0) {
    rows = `<tr class="empty"><td colspan="7">No assignments</td></tr>`
  } else {
    activeAssignments.forEach(([pid, asgn]) => {
      const project = period.projects.find((p) => p.id === pid)
      if (!project) return
      const effCap = calcEffectiveCapacity(employee, asgn)
      const rev = calcEmployeeRevenue(employee, project, period.employees)
      const cost = calcEmployeeCost(employee, pid)
      const profit = rev - cost
      rows += `
        <tr>
          <td>${project.projectName}</td>
          <td>${asgn.capacity.toFixed(1)}</td>
          <td>${asgn.fit.toFixed(1)}</td>
          <td>${effCap.toFixed(3)}</td>
          <td>${fmt(rev)}</td>
          <td>${fmt(cost)}</td>
          <td class="${profit >= 0 ? 'positive' : 'negative'}">${fmt(profit)}</td>
          <td>
            <button class="action-btn edit-assign-btn"
              data-employee-id="${employeeId}"
              data-project-id="${pid}">Edit</button>
            <button class="action-btn unassign-btn"
              data-employee-id="${employeeId}"
              data-project-id="${pid}">Unassign</button>
          </td>
        </tr>
      `
    })
  }

  const modal = createModal(`
    <h2>${employee.name} ${employee.surname} — Assignments</h2>
    <div class="popup-table-wrap">
      <table>
        <thead><tr>
          <th>Project</th><th>Capacity</th><th>Fit</th><th>Eff.Cap</th>
          <th>Revenue</th><th>Cost</th><th>Profit</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `)

  modal.querySelector('.popup-content').addEventListener('click', (e) => {
    if (e.target.closest('.edit-assign-btn')) {
      const btn = e.target.closest('.edit-assign-btn')
      closeModal(modal)
      openEditAssignPopup(
        btn.dataset.employeeId,
        btn.dataset.projectId,
        null,
        () => openShowAssignmentsPopup(employeeId),
      )
    }
    if (e.target.closest('.unassign-btn')) {
      const btn = e.target.closest('.unassign-btn')
      closeModal(modal)
      openUnassignPopup(btn.dataset.employeeId, btn.dataset.projectId, () =>
        openShowAssignmentsPopup(employeeId),
      )
    }
  })
}

// ============================================================
// SHOW EMPLOYEES POPUP (project → employees)
// ============================================================
function openShowEmployeesPopup(projectId) {
  const period = data.monthlyData[currentPeriod]
  if (!period) return
  const project = period.projects.find((p) => p.id === projectId)
  if (!project) return

  const assigned = period.employees.filter((e) => e.assignments?.[projectId])

  let rows = ''
  if (assigned.length === 0) {
    rows = `<tr class="empty"><td colspan="7">No employees assigned</td></tr>`
  } else {
    assigned.forEach((emp) => {
      const asgn = emp.assignments[projectId]
      const effCap = calcEffectiveCapacity(emp, asgn)
      const rev = calcEmployeeRevenue(emp, project, period.employees)
      const cost = calcEmployeeCost(emp, projectId)
      const profit = rev - cost
      rows += `
        <tr>
          <td>${emp.name} ${emp.surname}</td>
          <td>${asgn.capacity.toFixed(1)}</td>
          <td>${asgn.fit.toFixed(1)}</td>
          <td>${effCap.toFixed(3)}</td>
          <td>${fmt(rev)}</td>
          <td>${fmt(cost)}</td>
          <td class="${profit >= 0 ? 'positive' : 'negative'}">${fmt(profit)}</td>
          <td>
            <button class="action-btn edit-assign-btn"
              data-employee-id="${emp.id}"
              data-project-id="${projectId}">Edit</button>
            <button class="action-btn unassign-btn"
              data-employee-id="${emp.id}"
              data-project-id="${projectId}">Unassign</button>
          </td>
        </tr>
      `
    })
  }

  const { revenue, cost, profit } = calcProjectFinancials(
    project,
    period.employees,
  )

  const modal = createModal(`
    <h2>${project.projectName} — Employees</h2>
    <div class="popup-table-wrap">
      <table>
        <thead><tr>
          <th>Employee</th><th>Capacity</th><th>Fit</th><th>Eff.Cap</th>
          <th>Revenue</th><th>Cost</th><th>Profit</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="popup-totals">
      Total — Revenue: <span>${fmt(revenue)}</span> &nbsp;|&nbsp;
      Cost: <span>${fmt(cost)}</span> &nbsp;|&nbsp;
      Profit: <span class="${profit >= 0 ? 'positive' : 'negative'}">${fmt(profit)}</span>
    </div>
  `)

  modal.querySelector('.popup-content').addEventListener('click', (e) => {
    if (e.target.closest('.edit-assign-btn')) {
      const btn = e.target.closest('.edit-assign-btn')
      closeModal(modal)
      openEditAssignPopup(
        btn.dataset.employeeId,
        btn.dataset.projectId,
        null,
        () => openShowEmployeesPopup(projectId),
      )
    }
    if (e.target.closest('.unassign-btn')) {
      const btn = e.target.closest('.unassign-btn')
      closeModal(modal)
      openUnassignPopup(btn.dataset.employeeId, btn.dataset.projectId, () =>
        openShowEmployeesPopup(projectId),
      )
    }
  })
}

// ============================================================
// EDIT ASSIGNMENT POPUP
// ============================================================
function openEditAssignPopup(employeeId, projectId, triggerBtn, onClose) {
  const period = data.monthlyData[currentPeriod]
  const employee = period.employees.find((e) => e.id === employeeId)
  const project = period.projects.find((p) => p.id === projectId)
  if (!employee || !project) return

  const asgn = employee.assignments[projectId]
  const otherCap = Object.entries(employee.assignments)
    .filter(
      ([pid]) => pid !== projectId && period.projects.find((p) => p.id === pid),
    )
    .reduce((sum, [, a]) => sum + a.capacity, 0)

  const modal = createModal(`
    <h2>Edit Assignment</h2>
    <p style="color:#94a3b8;margin-bottom:12px">${employee.name} ${employee.surname} → ${project.projectName}</p>
    <div class="form-group">
      <label>Capacity: <span id="editCapVal">${asgn.capacity.toFixed(1)}</span></label>
      <input type="range" id="editCapSlider" min="0" max="1.5" step="0.1" value="${asgn.capacity}" style="width:100%" />
    </div>
    <div class="form-group">
      <label>Project Fit: <span id="editFitVal">${asgn.fit.toFixed(1)}</span></label>
      <input type="range" id="editFitSlider" min="0" max="1.0" step="0.1" value="${asgn.fit}" style="width:100%" />
    </div>
    <div class="assign-popup-calc" id="editCalcInfo"></div>
    <div class="assign-popup-warning" id="editWarning"></div>
    <div class="panel-actions" style="margin-top:16px">
      <button class="cancel-btn" id="cancelEditBtn">Cancel</button>
      <button class="submit-btn" id="confirmEditBtn">Save</button>
    </div>
  `)

  function updateEditCalc() {
    const cap = Number(modal.querySelector('#editCapSlider').value)
    const fit = Number(modal.querySelector('#editFitSlider').value)
    modal.querySelector('#editCapVal').textContent = cap.toFixed(1)
    modal.querySelector('#editFitVal').textContent = fit.toFixed(1)
    const effCap = cap * fit
    const newTotal = otherCap + cap
    modal.querySelector('#editCalcInfo').innerHTML =
      `Effective capacity: <strong>${effCap.toFixed(2)}</strong> &nbsp;|&nbsp; New total: <strong>${newTotal.toFixed(1)}/1.5</strong>`
    const warnEl = modal.querySelector('#editWarning')
    const confirmBtn = modal.querySelector('#confirmEditBtn')
    if (newTotal > 1.5) {
      warnEl.textContent = '⚠ Employee capacity limit (1.5) will be exceeded'
      confirmBtn.disabled = true
    } else {
      warnEl.textContent = ''
      confirmBtn.disabled = false
    }
  }

  modal
    .querySelector('#editCapSlider')
    .addEventListener('input', updateEditCalc)
  modal
    .querySelector('#editFitSlider')
    .addEventListener('input', updateEditCalc)
  updateEditCalc()

  modal.querySelector('#cancelEditBtn').onclick = () => {
    closeModal(modal)
    if (onClose) onClose()
  }
  modal.querySelector('#confirmEditBtn').onclick = () => {
    const cap = Number(modal.querySelector('#editCapSlider').value)
    const fit = Number(modal.querySelector('#editFitSlider').value)
    employee.assignments[projectId] = { capacity: cap, fit }
    saveData()
    closeModal(modal)
    renderEmployees()
    renderProjects()
    if (onClose) onClose()
  }
}

// ============================================================
// UNASSIGN CONFIRMATION POPUP
// ============================================================
function openUnassignPopup(employeeId, projectId, onClose) {
  const period = data.monthlyData[currentPeriod]
  const employee = period.employees.find((e) => e.id === employeeId)
  const project = period.projects.find((p) => p.id === projectId)
  if (!employee || !project) return

  const asgn = employee.assignments[projectId]
  const effCap = calcEffectiveCapacity(employee, asgn)
  const rev = calcEmployeeRevenue(employee, project, period.employees)
  const cost = calcEmployeeCost(employee, projectId)
  const profit = rev - cost

  const { profit: projProfit } = calcProjectFinancials(
    project,
    period.employees,
  )
  const usedCap = calcProjectUsedCapacity(projectId, period.employees)

  // simulate after unassign
  const tempEmployee = { ...employee, assignments: { ...employee.assignments } }
  delete tempEmployee.assignments[projectId]
  const tempEmployees = period.employees.map((e) =>
    e.id === employeeId ? tempEmployee : e,
  )
  const { profit: projProfitAfter } = calcProjectFinancials(
    project,
    tempEmployees,
  )
  const usedCapAfter = usedCap - asgn.capacity

  const modal = createModal(`
    <h2>Unassign Confirmation</h2>
    <p style="color:#94a3b8;margin-bottom:16px">
      <strong style="color:#cbd5f5">${employee.name} ${employee.surname}</strong> from
      <strong style="color:#cbd5f5">${project.projectName}</strong>
    </p>
    <div class="unassign-details">
      <div class="unassign-row"><span>Assigned Capacity</span><span>${asgn.capacity.toFixed(1)}</span></div>
      <div class="unassign-row"><span>Effective Capacity</span><span>${effCap.toFixed(3)}</span></div>
      <div class="unassign-row"><span>Salary Share (cost)</span><span>${fmt(cost)}</span></div>
      <div class="unassign-row"><span>Employee Revenue</span><span>${fmt(rev)}</span></div>
      <div class="unassign-row"><span>Employee Profit</span><span class="${profit >= 0 ? 'positive' : 'negative'}">${fmt(profit)}</span></div>
      <div class="unassign-sep"></div>
      <div class="unassign-row"><span>Project Capacity Before</span><span>${usedCap.toFixed(1)}/${project.capacity}</span></div>
      <div class="unassign-row"><span>Project Capacity After</span><span>${usedCapAfter.toFixed(1)}/${project.capacity}</span></div>
      <div class="unassign-row"><span>Project Profit Before</span><span class="${projProfit >= 0 ? 'positive' : 'negative'}">${fmt(projProfit)}</span></div>
      <div class="unassign-row"><span>Project Profit After</span><span class="${projProfitAfter >= 0 ? 'positive' : 'negative'}">${fmt(projProfitAfter)}</span></div>
    </div>
    <div class="panel-actions" style="margin-top:16px">
      <button class="cancel-btn" id="cancelUnassignBtn">Cancel</button>
      <button class="submit-btn" style="background:linear-gradient(135deg,#ef4444,#b91c1c)" id="confirmUnassignBtn">Unassign</button>
    </div>
  `)

  modal.querySelector('#cancelUnassignBtn').onclick = () => {
    closeModal(modal)
    if (onClose) onClose()
  }
  modal.querySelector('#confirmUnassignBtn').onclick = () => {
    delete employee.assignments[projectId]
    saveData()
    closeModal(modal)
    renderEmployees()
    renderProjects()
    if (onClose) onClose()
  }
}

// ============================================================
// MODAL HELPER
// ============================================================
function createModal(innerHtml) {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'

  const content = document.createElement('div')
  content.className = 'popup-content'
  content.innerHTML = `
    <button class="close-btn modal-close-btn">×</button>
    ${innerHtml}
  `

  backdrop.appendChild(content)
  document.body.appendChild(backdrop)

  // prevent closing when clicking inside content
  content.addEventListener('click', (e) => e.stopPropagation())

  // close on backdrop click
  backdrop.addEventListener('click', () => closeModal(backdrop))

  // close button
  content.querySelector('.modal-close-btn').onclick = () => closeModal(backdrop)

  return backdrop
}

function closeModal(modal) {
  if (modal && modal.parentNode) modal.remove()
}

// ============================================================
// SEED DATA
// ============================================================
document
  .getElementById('seedDataBtn')
  .addEventListener('click', openSeedDataPopup)

function openSeedDataPopup() {
  const allPeriods = Object.keys(data.monthlyData).filter((key) => {
    if (key === currentPeriod) return false
    const p = data.monthlyData[key]
    return p && (p.projects.length > 0 || p.employees.length > 0)
  })

  let rows = ''
  if (allPeriods.length === 0) {
    rows = `<tr class="empty"><td colspan="5">No other months with data</td></tr>`
  } else {
    // sort by date descending
    allPeriods
      .sort((a, b) => {
        const [ay, am] = a.split('-').map(Number)
        const [by, bm] = b.split('-').map(Number)
        return by !== ay ? by - ay : bm - am
      })
      .forEach((key) => {
        const [year, monthIndex] = key.split('-').map(Number)
        const period = data.monthlyData[key]
        const monthName = months[monthIndex]

        // calculate total income for that period
        let totalProfit = 0
        period.projects.forEach((p) => {
          totalProfit += calcProjectFinancials(p, period.employees).profit
        })

        rows += `
        <tr>
          <td>${monthName} ${year}</td>
          <td>${period.projects.length}</td>
          <td>${period.employees.length}</td>
          <td class="${totalProfit >= 0 ? 'positive' : 'negative'}">${fmt(totalProfit)}</td>
          <td>
            <button class="action-btn seed-confirm-btn" data-key="${key}">Seed</button>
          </td>
        </tr>
      `
      })
  }

  const [curYear, curMonthIndex] = currentPeriod.split('-').map(Number)
  const currentMonthName = `${months[curMonthIndex]} ${curYear}`

  const modal = createModal(`
    <h2>Seed Data</h2>
    <p style="color:#94a3b8;margin-bottom:16px">
      Copy data from another month into <strong style="color:#cbd5f5">${currentMonthName}</strong>.
      Vacation days will be cleared.
    </p>
    <div class="popup-table-wrap">
      <table>
        <thead><tr>
          <th>Period</th>
          <th>Projects</th>
          <th>Employees</th>
          <th>Est. Income</th>
          <th>Action</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `)

  modal.querySelector('.popup-content').addEventListener('click', (e) => {
    const btn = e.target.closest('.seed-confirm-btn')
    if (!btn) return

    const sourceKey = btn.dataset.key
    const [srcYear, srcMonthIndex] = sourceKey.split('-').map(Number)
    const sourceName = `${months[srcMonthIndex]} ${srcYear}`
    const [curYear, curMonthIndex] = currentPeriod.split('-').map(Number)
    const targetName = `${months[curMonthIndex]} ${curYear}`

    if (
      !confirm(
        `Copy data from ${sourceName} to ${targetName}? Current data will be overwritten.`,
      )
    )
      return

    // deep copy
    const sourcePeriod = JSON.parse(JSON.stringify(data.monthlyData[sourceKey]))

    // clear vacation days from all employees
    sourcePeriod.employees.forEach((emp) => {
      emp.vacations = {}
    })

    data.monthlyData[currentPeriod] = sourcePeriod
    saveData()
    closeModal(modal)
    renderProjects()
    renderEmployees()
  })
}

// ============================================================
// INITIAL RENDER
// ============================================================
renderProjects()
renderEmployees()
