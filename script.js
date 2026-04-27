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

const openEmpBtn = document.querySelectorAll('.add-btn.employees')
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
