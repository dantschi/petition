DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- creating the table in the salt-petition database:
--  psql salt-petition -f sql/users.sql

--
-- start psql with the salt petition table
-- psql salt-petition
--
-- checking the existing tables
-- \dt
