import inquirer from 'inquirer';
import pool from './db/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queries = fs.readFileSync(path.join(__dirname, 'db', 'queries.sql'), 'utf-8').split(';').map(query => query.trim()).filter(query => query.length > 0);

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
            await viewDepartments();
            break;
        case 'View all roles':
            await viewRoles();
            break;
        case 'View all employees':
            await viewEmployees();
            break;
        case 'Add a department':
            await addDepartment();
            break;
        case 'Add a role':
            await addRole();
            break;
        case 'Add an employee':
            await addEmployee();
            break;
        case 'Update an employee role':
            await updateEmployeeRole();
            break;
        case 'Update an employee manager':
            await updateEmployeeManager();
            break;
        case 'View employees by manager':
            await viewEmployeesByManager();
            break;
        case 'View employees by department':
            await viewEmployeesByDepartment();
            break;
        case 'View the total utilized budget of a department':
            await viewDepartmentBudget();
            break;
        case 'Delete a department':
            await deleteDepartment();
            break;
        case 'Delete a role':
            await deleteRole();
            break;
        case 'Delete an employee':
            await deleteEmployee();
            break;
        case 'Exit':
            pool.end();
            process.exit();
    }
}

async function viewDepartments() {
    const res = await pool.query(queries[0]);
    console.table(res.rows);
    mainMenu();
}

async function viewRoles() {
    const res = await pool.query(queries[1]);
    console.table(res.rows);
    mainMenu();
}

async function viewEmployees() {
    const res = await pool.query(queries[2]);
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

    await pool.query(queries[3], [name]);
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

    await pool.query(queries[4], [title, salary, department_id]);
    console.log(`The role '${title}' was added to the database!`);
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
    
    await pool.query(queries[5], [first_name, last_name, role_id, parsedManagerId]);
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

    await pool.query(queries[6], [new_role_id, new_manager_id, employee_id]);
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

    await pool.query(queries[7], [new_manager_id, employee_id]);
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

    const res = await pool.query(queries[8], [manager_id]);
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

    const res = await pool.query(queries[9], [department_id]);
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

    const res = await pool.query(queries[10], [department_id]);
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
    await pool.query(queries[11], [department_id]);
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
    await pool.query(queries[12], [role_id]);
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
    await pool.query(queries[13], [employee_id]);
    console.log(`Employee '${selectedEmployee.name}' has been terminated! :(`);
    mainMenu();
}

mainMenu();
