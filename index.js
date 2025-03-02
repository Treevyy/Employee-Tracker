import inquirer from 'inquirer';
import pool from './db/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read external SQL queries file and split into individual statements
const queriesPath = path.join(__dirname, 'db', 'queries.sql');
const queries = fs.readFileSync(queriesPath, 'utf-8')
    .split(';')
    .map(query => query.trim())
    .filter(query => query.length > 0);

// Map query names to positions in the queries file
const getQuery = (name) => {
    const queryMap = {
        viewDepartments: queries[0],
        viewRoles: queries[1],
        viewEmployees: queries[2],
        addDepartment: queries[3],
        addRole: queries[4],
        addEmployee: queries[5],
        updateEmployeeRole: queries[6],
        updateEmployeeManager: queries[7],
        viewEmployeesByManager: queries[8],
        viewEmployeesByDepartment: queries[9],
        viewDepartmentBudget: queries[10],
        deleteDepartment: queries[11],
        deleteRole: queries[12],
        deleteEmployee: queries[13]
    };
    return queryMap[name];
};

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

    const { action } = await inquirer.prompt(questions);

    switch (action) {
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
    const queryText = getQuery('viewDepartments');
    const res = await pool.query(queryText);
    console.table(res.rows);
    await mainMenu();
}

async function viewRoles() {
    // Using the external query to get all roles
    const queryText = getQuery('viewRoles');
    const res = await pool.query(queryText);
    console.table(res.rows);
    await mainMenu();
}

async function viewEmployees() {
    const queryText = getQuery('viewEmployees');
    const res = await pool.query(queryText);
    console.table(res.rows);
    await mainMenu();
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
    if (!confirm) return mainMenu();

    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?'
        }
    ]);
    const queryText = getQuery('addDepartment');
    await pool.query(queryText, [name]);
    console.log(`Department '${name}' was added to the database!`);
    await mainMenu();
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
    if (!confirm) return mainMenu();

    // Get departments for department choices
    const depQuery = getQuery('viewDepartments');
    const departmentsRes = await pool.query(depQuery);
    const departmentChoices = departmentsRes.rows.map(dept => ({ name: dept.name, value: dept.id }));

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
    const queryText = getQuery('addRole');
    await pool.query(queryText, [title, salary, department_id]);
    console.log(`The role '${title}' was added to the database!`);
    await mainMenu();
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
    if (!confirm) return mainMenu();

    // Retrieve employee and role choices for prompts
    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const rolesRes = await pool.query(getQuery('viewRoles'));
    const roleChoices = rolesRes.rows.map(role => ({ name: role.title, value: role.id }));
    const managerChoices = employeesRes.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
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
    const queryText = getQuery('addEmployee');
    await pool.query(queryText, [first_name, last_name, role_id, manager_id]);
    console.log(`Employee '${first_name} ${last_name}' was added to the database!`);
    await mainMenu();
}

async function updateEmployeeRole() {
    // Get employees and roles for choices
    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const rolesRes = await pool.query(getQuery('viewRoles'));
    const employeeChoices = employeesRes.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));
    employeeChoices.unshift({ name: 'Exit', value: null });
    const roleChoices = rolesRes.rows.map(role => ({ name: role.title, value: role.id }));
    const managerChoices = employeesRes.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));
    managerChoices.unshift({ name: 'None', value: null });

    const { employee_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: "Which employee's role would you like to update?",
            choices: employeeChoices
        }
    ]);
    if (employee_id === null) return mainMenu();

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
    const queryText = getQuery('updateEmployeeRole');
    await pool.query(queryText, [new_role_id, new_manager_id, employee_id]);
    const selectedEmployee = employeeChoices.find(emp => emp.value === employee_id);
    console.log(`Employee role for '${selectedEmployee.name}' has been updated!`);
    await mainMenu();
}

async function updateEmployeeManager() {
    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employeeChoices = employeesRes.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));
    employeeChoices.unshift({ name: 'Exit', value: null });
    const { employee_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: "Which employee's manager would you like to update?",
            choices: employeeChoices
        }
    ]);
    if (employee_id === null) return mainMenu();

    // Filter out the selected employee from the manager choices
    const managerChoices = employeesRes.rows
        .filter(emp => emp.id !== employee_id)
        .map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }));
    managerChoices.unshift({ name: 'None', value: null });

    const { new_manager_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'new_manager_id',
            message: 'Who is the new manager of the employee?',
            choices: managerChoices
        }
    ]);
    const queryText = getQuery('updateEmployeeManager');
    await pool.query(queryText, [new_manager_id, employee_id]);
    const selectedEmployee = employeeChoices.find(emp => emp.value === employee_id);
    console.log(`Employee manager for '${selectedEmployee.name}' has been updated!`);
    await mainMenu();
}

async function viewEmployeesByManager() {
    const managersRes = await pool.query(`
        SELECT DISTINCT manager.id, manager.first_name, manager.last_name
        FROM employee
        INNER JOIN employee AS manager ON employee.manager_id = manager.id
    `);
    const managerChoices = managersRes.rows.map(manager => ({
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
    if (manager_id === null) return mainMenu();

    const queryText = getQuery('viewEmployeesByManager');
    const res = await pool.query(queryText, [manager_id]);
    console.table(res.rows);
    await mainMenu();
}

async function viewEmployeesByDepartment() {
    const departmentsRes = await pool.query(getQuery('viewDepartments'));
    const departmentChoices = departmentsRes.rows.map(dept => ({
        name: dept.name,
        value: dept.id
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
    if (department_id === null) return mainMenu();

    const queryText = getQuery('viewEmployeesByDepartment');
    const res = await pool.query(queryText, [department_id]);
    console.table(res.rows);
    await mainMenu();
}

async function viewDepartmentBudget() {
    const departmentsRes = await pool.query(getQuery('viewDepartments'));
    const departmentChoices = departmentsRes.rows.map(dept => ({
        name: dept.name,
        value: dept.id
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
    if (department_id === null) return mainMenu();

    const queryText = getQuery('viewDepartmentBudget');
    const res = await pool.query(queryText, [department_id]);
    console.table(res.rows);
    await mainMenu();
}

async function deleteDepartment() {
    const departmentsRes = await pool.query(getQuery('viewDepartments'));
    const departmentChoices = departmentsRes.rows.map(dept => ({
        name: dept.name,
        value: dept.id
    }));
    // Optionally add an exit or none option
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
        console.log('No departments were deleted!');
        return mainMenu();
    }
    const selectedDepartment = departmentChoices.find(dept => dept.value === department_id);
    const queryText = getQuery('deleteDepartment');
    await pool.query(queryText, [department_id]);
    console.log(`Department '${selectedDepartment.name}' has been deleted!`);
    await mainMenu();
}

async function deleteRole() {
    const rolesRes = await pool.query(getQuery('viewRoles'));
    const roleChoices = rolesRes.rows.map(role => ({
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
        console.log('No roles were deleted!');
        return mainMenu();
    }
    const selectedRole = roleChoices.find(role => role.value === role_id);
    const queryText = getQuery('deleteRole');
    await pool.query(queryText, [role_id]);
    console.log(`Role '${selectedRole.name}' has been deleted!`);
    await mainMenu();
}

async function deleteEmployee() {
    const employeesRes = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employeeChoices = employeesRes.rows.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
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
        console.log("No employee's were terminated! :)");
        return mainMenu();
    }
    const selectedEmployee = employeeChoices.find(emp => emp.value === employee_id);
    const queryText = getQuery('deleteEmployee');
    await pool.query(queryText, [employee_id]);
    console.log(`Employee '${selectedEmployee.name}' has been terminated! :(`);
    await mainMenu();
}

mainMenu();