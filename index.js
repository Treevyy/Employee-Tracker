const inquirer = require('inquirer');
const pool = require('./db/config.js');

async function mainMenu() {
    const { action } = await inquirer.prompt([
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
            'Exit'
        ]
        }
    ])

switch (action) {
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
    const res = await pool.query('SELECT * FROM role');
    console.table(res.rows);
    mainMenu();
}
async function viewEmployees() {
    const res = await pool.query('SELECT * FROM employee');
    console.table(res.rows);
    mainMenu();
}

async function addDepartment() {
    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?'
        }
    ]);
    await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
    console.log('Department added!');
    mainMenu();
}

async function addRole() {
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
            type: 'input',
            name: 'department_id',
            message: 'What is the department ID of the role?'
        }
    ]);
    await pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, department_id]);
    console.log('Role added!');
    mainMenu();
}

async function addEmployee() {
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
            type: 'input',
            name: 'role_id',
            message: 'What is the role ID of the employee?'
        },
        {
            type: 'input',
            name: 'manager_id',
            message: 'What is the manager ID of the employee?'
        }
    ]);
    await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [first_name, last_name, role_id, manager_id]);
    console.log('Employee added!');
    mainMenu();
}

async function updateEmployeeRole() {
    const { employee_id, role_id } = await inquirer.prompt([
        {
            type: 'input',
            name: 'employee_id',
            message: 'What is the ID of the employee?'
        },
        {
            type: 'input',
            name: 'new_role_id',
            message: 'What is the new role ID of the employee?'
        }
    ]);
    await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [role_id, employee_id]);
    console.log('Employee role updated!');
    mainMenu();
}

mainMenu();
