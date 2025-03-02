import inquirer from 'inquirer';
import pool from './db/config.js';

async function mainMenu() {
const questions = [
    {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            'Update an employee manager',
            'View employees by manager',
            'View employees by department',
            'View the total utilized budget of a department',
            'Delete a department',
            'Delete a role',
            'Delete an employee',
            'Exit'
        ]
    }
];

const answers = await inquirer.prompt(questions);

switch (answers.action) {
    case 'View all departments':
        viewDepartments();
        break;
    case 'View all roles':
        viewRoles();
        break;
    case 'View all employees':
        viewEmployees();
        break;
    case 'Add a department':
        addDepartment();
        break;
    case 'Add a role':
        addRole();
        break;
    case 'Add an employee':
        addEmployee();
        break;
    case 'Update an employee role':
        updateEmployeeRole();
        break;
    case 'Update an employee manager':
        updateEmployeeManager();
        break;
    case 'View employees by manager':
        viewEmployeesByManager();
        break;
    case 'View employees by department':
        viewEmployeesByDepartment();
        break;
    case 'View the total utilized budget of a department':
        viewDepartmentBudget();
        break;
    case 'Delete a department':
        deleteDepartment();
        break;
    case 'Delete a role':
        deleteRole();
        break;
    case 'Delete an employee':
        deleteEmployee();
        break;
    case 'Exit':
        pool.end();
        process.exit();
    }
}

async function viewDepartments() {
    const res = await pool.query('SELECT * FROM department');
    console.table(res.rows);
    mainMenu();
}

async function viewRoles() {
    const res = await pool.query(`
        SELECT 
         role.id, 
         role.title, 
         department.name AS department, 
         role.salary 
        FROM role 
        JOIN department ON role.department_id = department.id;`);
    console.table(res.rows);
    mainMenu();
}

async function viewEmployees() {
    const queryText = `
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
    `;
    const res = await pool.query(queryText);
    console.table(res.rows);
    mainMenu();
}

async function addDepartment() {
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to add a new department?',
            default: false
        }
    ]);

    if (!confirm) {
        return mainMenu();
    }

    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?'
        }
    ]);

    await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
    console.log(`Department '${name}' was added to the database!`);
    mainMenu();
}

async function addRole() {
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to add a new role?',
            default: false
        }
    ]);

    if (!confirm) {
        return mainMenu();
    }

    const departmentsRes = await pool.query('SELECT id, name FROM department');
    const departments = departmentsRes.rows;
    const departmentChoices = departments.map(department => ({
        name: department.name,
        value: department.id
    }));

    const { title, salary, department_id } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is the title of the role?'
        },
        {
            type: 'input',
            name: 'salary',
            message: 'What is the salary of the role?'
        },
        {
            type: 'list',
            name: 'department_id',
            message: 'What department does this role belong to?',
            choices: departmentChoices
        }
    ]);

    await pool.query(`INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`, [title, salary, department_id]);
    console.log(`The role '${title} was added to the database!`);
    mainMenu();
}

async function addEmployee() {
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Do you want to add a new employee?',
            default: false
        }
    ]);

    if (!confirm) {
        return mainMenu();
    }

    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees = employeesRes.rows;

    const rolesRes = await pool.query('SELECT id, title FROM role');
    const roles = rolesRes.rows;
    const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id
    }));

    const managerChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));
    managerChoices.unshift({ name: 'None', value: null });

    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
        {
            type: 'input',
            name: 'first_name',
            message: 'What is the first name of the employee?'
        },
        {
            type: 'input',
            name: 'last_name',
            message: 'What is the last name of the employee?'
        },
        {
            type: 'list',
            name: 'role_id',
            message: 'What is the role of the employee?',
            choices: roleChoices
        },
        {
            type: 'list',
            name: 'manager_id',
            message: 'Who is the manager of the employee?',
            choices: managerChoices
        }
    ]);

    const parsedManagerId = manager_id === '' ? null: manager_id;
    
    await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [first_name, last_name, role_id, parsedManagerId]);
    console.log(`Employee '${first_name} ${last_name}' was added to the database!`);
    mainMenu();
}

async function updateEmployeeRole() {

    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees = employeesRes.rows;
    const employeeChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));
    employeeChoices.unshift({ name: 'Exit', value: null });

    const rolesRes = await pool.query('SELECT id, title FROM role');
    const roles = rolesRes.rows;
    const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id
    }));

    const managerChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));
    managerChoices.unshift({ name: 'None', value: null });

    const { employee_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: `Which employee's role would you like to update?`,
            choices: employeeChoices
        }
    ]);

    if (employee_id === null) {
        return mainMenu();
    }

    const { new_role_id, new_manager_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'new_role_id',
            message: 'What is the new role of the employee?',
            choices: roleChoices
        },
        {
            type: 'list',
            name: 'new_manager_id',
            message: 'Who is the new manager of the employee?',
            choices: managerChoices
        }
    ]);

    const selectedEmployee = employeeChoices.find(employee => employee.value === employee_id);

    await pool.query('UPDATE employee SET role_id = $1, manager_id = $2 WHERE id = $3', [new_role_id, new_manager_id, employee_id]);
    console.log(`Employee role for '${selectedEmployee.name}' has been updated!`);
    mainMenu();
}

async function updateEmployeeManager() {
    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees = employeesRes.rows;
    const employeeChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));
    employeeChoices.unshift({ name: 'Exit', value: null });

    const { employee_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: `Which employee's manager would you like to update?`,
            choices: employeeChoices
        }
    ]);

    if (employee_id === null) {
        return mainMenu();
    }

    const managerChoices = employees
        .filter(employee => employee.id !== employee_id)
        .map(employee => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id
        }));
    managerChoices.unshift({ name: 'None', value: null });

    const { new_manager_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'new_manager_id',
            message: 'Who is the new manager of the employee?',
            choices: managerChoices
        }
    ]);

    const selectedEmployee = employeeChoices.find(employee => employee.value === employee_id);

    await pool.query('UPDATE employee SET manager_id = $1 WHERE id = $2', [new_manager_id, employee_id]);
    console.log(`Employee manager for '${selectedEmployee.name}' has been updated!`);
    mainMenu();
}

async function viewEmployeesByManager() {
    const managersRes = await pool.query(`
        SELECT DISTINCT manager.id, manager.first_name, manager.last_name
        FROM employee
        INNER JOIN employee AS manager ON employee.manager_id = manager.id
    `);
    const managers = managersRes.rows;
    const managerChoices = managers.map(manager => ({
        name: `${manager.first_name} ${manager.last_name}`,
        value: manager.id
    }));
    managerChoices.unshift({ name: 'Exit', value: null });

    const { manager_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'manager_id',
            message: 'Select a manager to view their employees:',
            choices: managerChoices
        }
    ]);

    if (manager_id === null) {
        return mainMenu();
    }

    const queryText = `
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
    `;
    const res = await pool.query(queryText, [manager_id]);
    console.table(res.rows);
    mainMenu();
}

async function viewEmployeesByDepartment() {
    const departmentsRes = await pool.query('SELECT id, name FROM department');
    const departments = departmentsRes.rows;
    const departmentChoices = departments.map(department => ({
        name: department.name,
        value: department.id
    }));
    departmentChoices.unshift({ name: 'Exit', value: null });

    const { department_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'department_id',
            message: 'Select a department to view its employees:',
            choices: departmentChoices
        }
    ]);

    if (department_id === null) {
        return mainMenu();
    }

    const queryText = `
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
    `;
    const res = await pool.query(queryText, [department_id]);
    console.table(res.rows);
    mainMenu();
}

async function viewDepartmentBudget() {
    const departmentsRes = await pool.query('SELECT id, name FROM department');
    const departments = departmentsRes.rows;
    const departmentChoices = departments.map(department => ({
        name: department.name,
        value: department.id
    }));
    departmentChoices.unshift({ name: 'Exit', value: null });

    const { department_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'department_id',
            message: 'Select a department to view its total utilized budget:',
            choices: departmentChoices
        }
    ]);

    if (department_id === null) {
        return mainMenu();
    }

    const queryText = `
        SELECT
          department.name AS department,
          SUM(role.salary) AS utilized_budget
        FROM employee
        LEFT JOIN role ON employee.role_id = role.id
        LEFT JOIN department ON role.department_id = department.id
        WHERE department.id = $1
        GROUP BY department.name;
    `;
    const res = await pool.query(queryText, [department_id]);
    console.table(res.rows);
    mainMenu();
}

async function deleteDepartment() {
    const departmentsRes = await pool.query('SELECT id, name FROM department');
    const departments = departmentsRes.rows;
    const departmentChoices = departments.map(department => ({
        name: department.name,
        value: department.id
    }));
    
    if (!departmentChoices.some(choice => choice.name === 'None')) {
        departmentChoices.unshift({ name: 'None', value: null });
    }

    const { department_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'department_id',
            message: 'Which department would you like to delete?',
            choices: departmentChoices
        }
    ]);

    if (department_id === null) {
        console.log(`No departments were deleted!`);
        return mainMenu();
    }

    const selectedDepartment = departmentChoices.find(department => department.value === department_id);
    await pool.query('DELETE FROM department WHERE id = $1', [department_id]);
    console.log(`Department '${selectedDepartment.name}' has been deleted!`);
    mainMenu();
}

async function deleteRole() {
    const rolesRes = await pool.query('SELECT id, title FROM role');
    const roles = rolesRes.rows;
    const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id
    }));

    if (!roleChoices.some(choice => choice.name === 'None')) {
        roleChoices.unshift({ name: 'None', value: null });
    }

    const { role_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'role_id',
            message: 'Which role would you like to delete?',
            choices: roleChoices
        }
    ]);

    if (role_id === null) {
        console.log(`No roles were deleted!`);
        return mainMenu();
    }

    const selectedRole = roleChoices.find(role => role.value === role_id);
    await pool.query('DELETE FROM role WHERE id = $1', [role_id]);
    console.log(`Role '${selectedRole.name}' has been deleted!`);
    mainMenu();
}

async function deleteEmployee() {
    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees = employeesRes.rows;

    const employeeChoices = employees.map(employee => ({
        name: `${employee.first_name} ${employee.last_name}`,
        value: employee.id
    }));
    employeeChoices.unshift({ name: 'None', value: null });

    const { employee_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: 'Which employee would you like to terminate?',
            choices: employeeChoices
        }
    ]);

    if (employee_id === null) {
        console.log(`No employee's were terminated! :)`);
        return mainMenu();
    }

    const selectedEmployee = employeeChoices.find(employee => employee.value === employee_id);
    await pool.query('DELETE FROM employee WHERE id = $1', [employee_id]);
    console.log(`Employee '${selectedEmployee.name}' has been terminated! :(`);
    mainMenu();
}

mainMenu();
