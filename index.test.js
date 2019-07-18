const supertest = require("supertest"); //this is a node package, can be installed
const { app } = require("./index");

// here we're require the FAKE cookie-session --the on that live in the
// "__mocks__" directory
// we can put dummy data in it and use it
const cookieSession = require("cookie-session");

cookieSession;

test("not logged in user is redirected from /petition to /login", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/petition")
        .then(result => {
            console.log("result.headers ", result.headers);
            expect(result.statusCode).toBe(302);
            expect(result.headers.location).toBe("/login");
        });
});

test("logged in user is redirected from /login or /register to /petition", () => {
    cookieSession.mockSessionOnce({
        userId: 5,
        loggedIn: true
    });
    return supertest(app)
        .get("/login")
        .then(result => {
            console.log("result.headers in excercise 2", result.headers);
            expect(result.statusCode).toBe(302);
            expect(result.headers.location).toBe("/petition");
        });
});

test("logged in and signed user from GET /petition signature is redirected to /signed ", () => {
    cookieSession.mockSessionOnce({
        userId: 5,
        alreadySigned: true,
        loggedIn: true
    });
    return supertest(app)
        .get("/petition")
        .then(r => {
            console.log("result.headers in excercise3: ", r.headers);
            expect(r.statusCode).toBe(302);
            expect(r.headers.location).toBe("/signed");
        });
});

test("logged in and not signed user is redirected from /signed or /signers to /petition", () => {
    cookieSession.mockSessionOnce({
        userId: 3,
        loggedIn: true
    });
    return supertest(app)
        .get("/signed")
        .then(r => {
            console.log("r.header in excercise4 ", r.headers);
            expect(r.statusCode).toBe(302);
            expect(r.headers.location).toBe("/petition");
        });
});

// test("bonus1", () => {
//     cookieSession.mockSessionOnce({
//         userId: 4,
//         loggedIn: true
//     });
//     return supertest(app)
//         .post("/petition")
//         .send((signature = "notemptystring"))
//         .then(r => {
//             console.log("bonus good signature ", r.headers);
//             expect(r.statusCode).toBe(200);
//         });
// });
// we mock the npm packages that we have to use but did not create ourselves.
// for example cookie session

// test("GET /home returns an h1 as response", () => {
//     return supertest(app)
//         .get("/home")
//         .then(result => {
//             //'result' is the response from the server
//             console.log("headers", result.headers);
//             expect(result.statusCode).toBe(200);
//             expect(result.text).toBe("<h1>Home</h1>");
//             expect(result.headers["content-type"]).toContain("text/html");
//         });
// });

// 3 main properties of result that we will be interested in are:
//
// 1. text
// --text
// 2. status code
//
// 3. headers

// test.only("GET /home with no cookies causes me to be redirected", () => {
//     return supertest(app)
//         .get("/home")
//         .then(result => {
//             // in this block i want to check if i am redirected
//             // location header gives me the route that i've been redirected to
//             expect(result.statusCode).toBe(302);
//             expect(result.headers.location).toBe("/registration");
//         });
// });

// test('GET /home request sends h1 as response when "whatever" cookie is there', () => {
//     cookieSession.mockSessionOnce({
//         whatever: true
//     });
//
//     return supertest(app)
//         .get("/home")
//         .then(result => {
//             console.log("body of the response: ", result.text);
//             // result.session.whatever
//         });
// });

//this test is testing if the correct data has been written to a cookies
//in the test "obj" is our cookie, and we need to check if the correct data has been written to "obj"

// test("POST /welcome should set 'submitted'  cookie", () => {
//     // we will neet to work with mockSessionOnce if we want to
//     // (1) send a test / dummy cookie as part of the REQUEST we make the server;
//     // (2) if we need to see the cookie we receive as part of the response. in ither words,
//     // if we need to check that a cookie has been set, we need mockSession/mockSessionOnce
//
//     // send over an empty cookie as part of the REQUEST I make
//     // so that server has an empty cookie to put data into.
//     // in this case "data" refers to {submitted: true}
//     const obj = {};
//     cookieSession.mockSessionOnce(obj);
//
//     // next step is to use supertest to make POST request
//     return supertest(app)
//         .post("/welcome")
//         .then(res => {
//             // obj IS the cookie that my server wrote
//             console.log("obj", obj);
//             expect(obj).toEqual({
//                 submitted: true
//             });
//         });
// });
