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
