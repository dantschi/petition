-- create table for parts 1 and 2
-- DON'T RUN THIS FILE TILL PART 3

DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) UNIQUE,

    -- INT and INTEGER are the same, there is no functional difference


    -- CODE --
    -- first_name VARCHAR(255) NOT NULL,
    -- last_name VARCHAR(255) NOT NULL,
    -- CODE --

    signature TEXT NOT NULL --it will be much bigger than 255 characters
);

-- how do we interact with our table?
