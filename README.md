# Employee & Project Dashboard

A single-page management application for tracking employees, projects, and their assignments across different time periods. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.

## Features

### Period Management
- Month/year selector to switch between time periods
- Each period stores its own independent snapshot of employees and projects
- Selected period and active tab persist across page refreshes via localStorage

### Projects
- Add projects with company name, project name, budget, and employee capacity
- View used capacity vs. total capacity per project
- See estimated income (profit) per project, color-coded positive/negative
- Delete project — automatically unassigns all employees from it
- "Show Employees" popup with detailed financial breakdown per assigned employee

### Employees
- Add employees with name, surname, date of birth, position, and salary
- Age calculated automatically from date of birth (18+ validation)
- Inline editing of Position (dropdown) and Salary (number input) directly in the table
- Delete employee — removes from current period only
- "Show Assignments" popup with per-project capacity, fit, revenue, cost, and profit

### Assignment System
- Assign employees to projects with configurable capacity (0.0–1.5) and project fit (0.0–1.0)
- Assign popup opens near the trigger button and repositions on scroll/resize to stay in viewport
- Real-time calculation of effective capacity (capacity × fit)
- Warning if employee total capacity would exceed 1.5 (blocks assignment)
- Warning if project effective capacity would be exceeded (shown but allows assignment)
- Edit assignment — adjust capacity and fit from both the employee and project detail popups
- Unassign confirmation popup showing full financial impact before and after

### Financial Calculations
- **Effective Capacity** = assigned capacity × project fit coefficient
- **Revenue** = (budget / max(projectCapacity, totalEffectiveCapacity)) × employeeEffectiveCapacity
- **Cost** = salary × max(0.5, assignedCapacity) — minimum 50% bench rate
- **Profit** = revenue − cost
- **Estimated Payment** = sum of costs across all assignments (or salary × 0.5 if unassigned)
- **Projected Income** = sum of profits across all assignments
- All financial values color-coded: green for positive, red for negative

### Sorting
- Clickable sort icons (⇅ / ↑ / ↓) on all numeric and text columns in both tables
- Ascending on first click, descending on second, active column highlighted
- Sorting applied after filtering

### Filtering
- Filter icons (⌕) on Company Name, Project Name, Name, Surname, Position columns
- Text input for name columns, dropdown for Position
- Active filters displayed as chips above the table in "Column: value" format
- Remove individual filters via × on each chip
- "Clear Filters" chip appears when 2 or more filters are active

### Seed Data
- "Seed Data" button on the Projects tab opens a popup listing all other periods that contain data
- Shows project count, employee count, and total estimated income per period
- One click copies the full dataset to the current month — projects, employees, and all assignments
- Vacation days are cleared on copy since they are month-specific

### Data Persistence
- All data stored in localStorage under the key `"monthlyData"`
- Structure: `{ "YYYY-M": { projects: [], employees: [] } }`
- Auto-saves after every modification (add, edit, delete, assign, unassign)
- Active tab and selected period also persisted separately

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, flexbox, CSS transitions) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | Web localStorage API |
| IDs | `crypto.randomUUID()` |

No build tools, no npm, no external libraries or frameworks.

## How to Run

1. Clone or download the repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. No server required — the app runs entirely in the browser

```
project/
├── index.html
├── script.js
└── css/
    ├── styles.css
    └── reset.css
```

> **Note:** The app uses `localStorage`, so data is tied to the browser and device. Clearing browser data will erase all stored periods.

## Implementation Notes

- **Data model:** each period key (`"2026-4"`) holds a complete independent copy of employees and projects. Assignments are stored inside each employee object as `{ [projectId]: { capacity, fit } }`, which keeps the employee self-contained.
- **No vacation coefficient:** the vacation calendar feature is intentionally excluded from financial calculations. Effective capacity is purely `capacity × fit`.
- **Deep copy on Seed Data:** `JSON.parse(JSON.stringify(...))` ensures the copied month is fully independent — editing one month never affects another.
- **Render pipeline:** data flows as raw array → filter → sort → render. Filtering and sorting never mutate the source array.