DROP TABLE IF EXISTS user_profiles;

CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR(255),
    url VARCHAR,
    user_id INTEGER NOT NULL REFERENCES users (id) UNIQUE
);
