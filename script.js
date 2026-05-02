// SIDEBAR
const sidebarButton = document.querySelector('.panel-button')
const sidebar = document.querySelector('.sidebar')
const mainScreen = document.querySelector('.main')

// toggle sidebar
const toggleSidebar = function () {
  sidebar.classList.toggle('hide')
  mainScreen.classList.toggle('shrink')
}

sidebarButton.addEventListener('click', () => {
  toggleSidebar()
})

// views buttons
const projectsButton = document.querySelector('.menu-btn.projects')
const employeesButton = document.querySelector('.menu-btn.employees')
//views screens
const projectsScreen = document.querySelector('.projects-screen')
const employeesScreen = document.querySelector('.employees-screen')

employeesButton.addEventListener('click', () => {
  projectsScreen.classList.add('hidden')
  employeesScreen.classList.remove('hidden')
  employeesButton.classList.add('active')
  projectsButton.classList.remove('active')
})

projectsButton.addEventListener('click', () => {
  employeesScreen.classList.add('hidden')
  projectsScreen.classList.remove('hidden')
  projectsButton.classList.add('active')
  employeesButton.classList.remove('active')
})

// set default value
document.getElementById('month').value = '3'
document.getElementById('year').value = '2026'

//date update
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

// OVERLAY PROJECT
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
overlay.onclick = closePanel

// validation
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
  const valid = Object.values(fields).every(checkField)
  submitBtn.disabled = !valid
}

Object.values(fields).forEach((field) => {
  field.el.addEventListener('input', () => {
    checkField(field)
    checkForm()
  })
  field.el.addEventListener('blur', () => checkField(field))
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
})

// OVERLAY EMPLOYEE
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

// validation
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
  const valid = Object.values(empFields).every(checkEmpField)
  empSubmit.disabled = !valid
}

Object.values(empFields).forEach((field) => {
  field.el.addEventListener('input', () => {
    checkEmpField(field)
    checkEmpForm()
  })
  field.el.addEventListener('blur', () => checkEmpField(field))
})

empForm.addEventListener('submit', (e) => e.preventDefault())

// GET DATA FROM USER

const data = {
  monthlyData: {},
}

let currentPeriod = '2026-3'

function getPeriodKey(year, monthIndex) {
  return `${year}-${monthIndex}`
}

//create month
function ensurePeriodExists() {
  if (!data.monthlyData[currentPeriod]) {
    data.monthlyData[currentPeriod] = {
      projects: [],
      employees: [],
    }
  }
}

// add project
document.getElementById('projectForm').addEventListener('submit', (e) => {
  e.preventDefault()

  ensurePeriodExists()

  const newProject = {
    companyName: companyName.value,
    projectName: projectName.value,
    budget: Number(budget.value),
    capacity: Number(capacity.value),
  }

  data.monthlyData[currentPeriod].projects.push(newProject)

  renderProjects()
})

// render project
const projectsTbody = document.querySelector('.projects tbody')

function renderProjects() {
  const period = data.monthlyData[currentPeriod]

  projectsTbody.innerHTML = ''

  if (!period || period.projects.length === 0) {
    projectsTbody.innerHTML = `
      <tr class="empty">
        <td colspan="6">No projects found</td>
      </tr>
    `
    updateTotalIncome()
    return
  }

  period.projects.forEach((p, index) => {
    const row = document.createElement('tr')

    row.innerHTML = `
      <td>${p.companyName}</td>
      <td>${p.projectName}</td>
      <td>$${p.budget}</td>
      <td>${p.capacity}</td>
      <td>$0</td>
      <td>
        <button class="action-btn delete-btn" data-index="${index}" data-type="project">Delete</button>
      </td>
    `

    projectsTbody.appendChild(row)
  })

  updateTotalIncome()
}

// add employee
document.getElementById('employeeForm').addEventListener('submit', (e) => {
  e.preventDefault()

  ensurePeriodExists()

  const dob = new Date(empDob.value)
  const age = new Date().getFullYear() - dob.getFullYear()

  const newEmployee = {
    name: empName.value,
    surname: empSurname.value,
    age,
    position: empPosition.value,
    salary: Number(empSalary.value),
  }

  data.monthlyData[currentPeriod].employees.push(newEmployee)

  renderEmployees()
})

// render employee
const employeesTbody = document.querySelector('.employees tbody')

function renderEmployees() {
  const period = data.monthlyData[currentPeriod]

  employeesTbody.innerHTML = ''

  if (!period || period.employees.length === 0) {
    employeesTbody.innerHTML = `
      <tr class="empty">
        <td colspan="9">No employees found</td>
      </tr>
    `
    return
  }

  const positions = ['Junior', 'Middle', 'Senior', 'Lead', 'Architect', 'BO']

  period.employees.forEach((e, index) => {
    const row = document.createElement('tr')

    const positionOptions = positions
      .map(pos => `<option value="${pos}" ${pos === e.position ? 'selected' : ''}>${pos}</option>`)
      .join('')

    row.innerHTML = `
      <td>${e.name}</td>
      <td>${e.surname}</td>
      <td>${e.age}</td>
      <td class="editable-cell" data-field="position" data-index="${index}">
        <span class="cell-view">${e.position}</span>
        <span class="cell-edit hidden">
          <select class="inline-select">${positionOptions}</select>
          <button class="ok-btn">OK</button>
        </span>
      </td>
      <td class="editable-cell" data-field="salary" data-index="${index}">
        <span class="cell-view">$${e.salary}</span>
        <span class="cell-edit hidden">
          <input type="number" step="0.01" class="inline-input" value="${e.salary}" min="0.01" />
          <button class="ok-btn">OK</button>
        </span>
      </td>
      <td>$0</td>
      <td>-</td>
      <td>$0</td>
      <td>
        <button class="action-btn delete-btn" data-index="${index}" data-type="employee">Delete</button>
      </td>
    `

    employeesTbody.appendChild(row)
  })
}

//month change
function changePeriod(year, monthIndex) {
  currentPeriod = `${year}-${monthIndex}`

  renderProjects()
  renderEmployees()
}

// TOTAL INCOME
function updateTotalIncome() {
  const totalEl = document.querySelector('.total .money')
  if (!totalEl) return
  totalEl.textContent = '$0.00'
}

// DELETE + INLINE EDIT
document.querySelector('.table-wrapper.projects').addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn')
  if (!btn || btn.dataset.type !== 'project') return

  const index = Number(btn.dataset.index)
  ensurePeriodExists()
  data.monthlyData[currentPeriod].projects.splice(index, 1)
  renderProjects()
})

document.querySelector('.table-wrapper.employees').addEventListener('click', (e) => {
  // Delete
  if (e.target.closest('.delete-btn')) {
    const btn = e.target.closest('.delete-btn')
    if (btn.dataset.type !== 'employee') return
    const index = Number(btn.dataset.index)
    ensurePeriodExists()
    data.monthlyData[currentPeriod].employees.splice(index, 1)
    renderEmployees()
    return
  }

  // Open inline edit on cell click
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

  // OK button — save inline edit
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

    renderEmployees()
  }
})