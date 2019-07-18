const redis = require("redis");
const client = redis.createClient(
    process.env.REDIS_URL || {
        host: "localhost",
        port: 6379
    }
);

client.on("error", err => {
    console.log("REDIS error", err);
});

//////////////// CLASS DEMO \\\\\\\\\\\\\\\\\\\\
//the REDIS methods are there on the client, they can be simply called with .method
//client.setex("name", 120, "ivana");

//promisifying the function. We get that from "util", we have to define it
const { promisify } = require("util");

// also exporting and force the client
// SETEX puts data into redis for a certain time
exports.setex = promisify(client.setex).bind(client);

//GET pullls or selects data from redis
exports.get = promisify(client.get).bind(client);

// DEL deletes from redis
exports.del = promisify(client.del).bind(client);
