-- View Departments
SELECT * FROM department ORDER BY id ASC;

-- View Roles
SELECT 
  role.id, 
  role.title, 
  department.name AS department, 
  role.salary 
FROM role 
JOIN department ON role.department_id = department.id;

-- View Employees
SELECT
  employee.id,
  employee.first_name,
  employee.last_name,
  role.title,
  department.name AS department,
  role.salary,  
  COALESCE(manager.first_name || ' ' || manager.last_name, 'None') AS employee_manager
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
LEFT JOIN employee AS manager ON manager.id = employee.manager_id
ORDER BY employee.id ASC;

-- Add Department
INSERT INTO department (name) VALUES ($1);

-- Add Role
INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3);

-- Add Employee
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4);

-- Update Employee Role (updates role and manager)
UPDATE employee SET role_id = $1, manager_id = $2 WHERE id = $3;

-- Update Employee Manager
UPDATE employee SET manager_id = $1 WHERE id = $2;

-- View Employees by Manager
SELECT
  employee.id,
  employee.first_name,
  employee.last_name,
  role.title,
  department.name AS department,
  role.salary,  
  COALESCE(manager.first_name || ' ' || manager.last_name, 'None') AS employee_manager
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
LEFT JOIN employee AS manager ON manager.id = employee.manager_id
WHERE employee.manager_id = $1
ORDER BY employee.id ASC;

-- View Employees by Department
SELECT
  employee.id,
  employee.first_name,
  employee.last_name,
  role.title,
  department.name AS department,
  role.salary,  
  COALESCE(manager.first_name || ' ' || manager.last_name, 'None') AS employee_manager
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
LEFT JOIN employee AS manager ON manager.id = employee.manager_id
WHERE department.id = $1
ORDER BY employee.id ASC;

-- View Department Budget
SELECT
  department.name AS department,
  SUM(role.salary) AS utilized_budget
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
WHERE department.id = $1
GROUP BY department.name;

-- Delete Department
DELETE FROM department WHERE id = $1;

-- Delete Role
DELETE FROM role WHERE id = $1;

-- Delete Employee
DELETE FROM employee WHERE id = $1;