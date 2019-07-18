// spicedPg setup

const spicedPg = require("spiced-pg");
// let username, pwd;
try {
    var { username, pwd } = require("./secret.json");
} catch (err) {
    console.log(err);
}

// process.env.NODE_ENV ==="production" ? secret = XXX : secret = "(./secret.json)";

//name of the database:username:password@localhost:port/DATABASE
const dbUrl =
    process.env.DATABASE_URL ||
    `postgres:${username}:${pwd}@localhost:5432/salt-petition`;
const db = spicedPg(dbUrl);

module.exports.addUser = function addUser(fn, ln, em, pw) {
    return db.query(
        `
        INSERT INTO users(first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        `,
        [fn, ln, em, pw]
    );
};

module.exports.addUserInfo = function addUserInfo(age, city, url, user_id) {
    return db.query(
        `
        INSERT INTO user_profiles(age, city, url, user_id)
        VALUES ($1,$2,$3,$4);
        `,
        [age, city, url, user_id]
    );
};

module.exports.addSignature = function addSignature(signature, uid) {
    return db.query(
        `
        INSERT INTO signatures(signature, user_id)
        VALUES ($1, $2)
        RETURNING id;
        `,
        [signature, uid]
    );
};

module.exports.deleteSignature = function deleteSignature(uid) {
    return db.query(
        `
        DELETE FROM signatures WHERE user_id=$1;
        `,
        [uid]
    );
};

module.exports.deleteUserProfile = function deleteUserProfile(uid) {
    return db.query(
        `
        DELETE FROM user_profiles WHERE user_profiles.user_id = $1;
        `,
        [uid]
    );
};

module.exports.deleteUser = function deleteUser(uid) {
    return db.query(
        `
        DELETE FROM users WHERE users.id = $1;

        `,
        [uid]
    );
};

module.exports.editUser = function editUser(fn, ln, em, id) {
    return db.query(
        `
        UPDATE users
        SET first_name=$1, last_name=$2, email=$3
        WHERE id=$4;

        `,
        [fn, ln, em, id]
    );
};

module.exports.editUserProfile = function editUserProfile(age, city, url, id) {
    return db.query(
        `
        INSERT INTO user_profiles(age,city,url,user_id)
        VALUES($1,$2,$3,$4)
        ON CONFLICT (user_id)
        DO UPDATE SET age=$1, city=$2, url=$3;

        `,
        [age || null, city || null, url || null, id]
    );
};

module.exports.editPassword = function editPassword(pwd, id) {
    return db.query(
        `
        UPDATE users
        SET password=$1
        WHERE id = $2;
        `,
        [pwd, id]
    );
};

module.exports.getUserId = function getUserId(email) {
    return db.query(
        `
        SELECT id FROM users WHERE email=$1;
        `,
        [email]
    );
};

module.exports.getUserPwd = function getUserPwd(email) {
    return db.query(
        `
        SELECT password FROM users WHERE email=$1;
        `,
        [email]
    );
};

//RETURNING gives back the ID that was just created

module.exports.getSignature = function getSignature(userid) {
    return db.query(
        `
        SELECT signature, id FROM signatures WHERE user_id=$1;
        `,
        [userid]
    );
};

module.exports.getSigners = function getSigners() {
    return db.query(
        `
        SELECT users.first_name AS first_name, users.last_name AS last_name, users.id AS user_id
        FROM users
        JOIN signatures
        ON users.id = signatures.user_id;
        `,
        []
    );
};

module.exports.getSignersByCity = function getSignersByCity(city) {
    return db.query(
        `
        SELECT first_name, last_name, age, city, url
        FROM signatures
        LEFT JOIN users ON signatures.user_id = users.id
        LEFT JOIN user_profiles ON users.id = user_profiles.user_id
        WHERE LOWER(city) = LOWER($1);
        `,
        [city]
    );
};

module.exports.getInfoForEdit = function getInfoForEdit(user_id) {
    return db.query(
        `
        SELECT users.first_name, users.last_name, users.email, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        JOIN user_profiles ON users.id = user_profiles.user_id
        WHERE users.id=$1;
        `,
        [user_id]
    );
};

module.exports.getUserInfo2 = function getUserInfo2() {
    return db.query(
        `
        SELECT signatures.user_id AS user_id, users.first_name AS first_name, users.last_name AS last_name, users.email AS email, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM signatures
        LEFT JOIN users ON users.id = signatures.user_id
        LEFT JOIN user_profiles ON users.id = user_profiles.user_id;
        `
    );
};

module.exports.getUserInfo = function getUserInfo() {
    return db.query(
        // SELECT user_profiles.age AS age, user_profiles.url AS url, user_profiles.city AS city
        `
        SELECT users.id AS user_id, users.first_name AS first_name, users.last_name AS last_name, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id;

        `
    );
};

module.exports.getSignersNr = function getSignersNr() {
    return db.query(
        `
        SELECT COUNT(*) FROM signatures;
        `,
        []
    );
};

// database queries
// module.exports.addCity = function addCity(city, country) {
//     return db.query(
//         `
//         INSERT INTO cities (city, country)
//         VALUES ($1, $2);
//         `,
//         [city, country]
//     );
// };

// because of SQL INJECTION ${city}, ${country} should not be used
