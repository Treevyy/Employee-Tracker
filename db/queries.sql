SELECT * FROM department;

SELECT 
    role.id, 
    role.title, 
    department.name AS department, 
    role.salary 
FROM role 
JOIN department ON role.department_id = department.id;

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

INSERT INTO department (name) VALUES ($1);

INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3);

INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4);

UPDATE employee SET role_id = $1, manager_id = $2 WHERE id = $3;

UPDATE employee SET manager_id = $1 WHERE id = $2;

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

SELECT
    department.name AS department,
    SUM(role.salary) AS utilized_budget
FROM employee
LEFT JOIN role ON employee.role_id = role.id
LEFT JOIN department ON role.department_id = department.id
WHERE department.id = $1
GROUP BY department.name;

DELETE FROM department WHERE id = $1;

DELETE FROM role WHERE id = $1;

DELETE FROM employee WHERE id = $1;