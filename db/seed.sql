INSERT INTO department (name) VALUES 
('Engineering'), 
('Sales'), 
('Finance'), 
('Legal');

INSERT INTO role (title, salary, department_id) VALUES 
('Software Engineer', 100000, 1), 
('Sales Lead', 80000, 2), 
('Accountant', 75000, 3), 
('Lawyer', 120000, 4);

INSERT INTO employee (first_name, last_name, role_id) VALUES 
('Alice', 'Johnson', 1), 
('Bob', 'Smith', 2), 
('Charlie', 'Davis', 3), 
('David', 'Wilson', 4);
