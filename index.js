// @ts-check
const express = require("express");
const app = express();
exports.app = app; //this must be used for supertest
const db = require("./utils/db");
const hb = require("express-handlebars");
const bodyParser = require("body-parser");
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bc = require("./utils/bc");
const csurf = require("csurf");

//calling the requireNoSignature function from the middleware file
// const { requireNoSignature } = require("./middleware");

// console.log(process.env.PORT);

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// app.use(cookieParser());

app.use(
    cookieSession({
        secret: "text",
        maxAge: 1000 * 60 * 60 * 24 * 14 //2 weeks
    })
);

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

// app.use(function(req, res, next) {
//     console.log(req.body, req.session, req.url);
//     next();
// });

/////////////////////////////////////////////
// IT MUST BE AFTER bodyParser and cookieSession)
app.use(csurf());
/////////////////////////////////////////////

////////////////////////////////////////////
// in the FROM:
// <input name="_csrf" type="hidden" value="{{csrfToken}}">
////////////////////////////////////////////

app.use(express.static(__dirname + "/public"));

////////////////////////////////////////////////

app.use((req, res, next) => {
    ////////////////////////////////////////////
    // this must be after calling the csurf(). ( app.use(csurf()); )
    // this adds csrf token to every single template in the GET requests
    // it is useful for get requests, but it is added to POST requests, too

    res.locals.csrfToken = req.csrfToken();

    ////////////////////////////////////////////
    // THIS PREVENTS THE SITE TO BE IFRAMED
    res.setHeader("X-FRAME-OPTIONS", "DENY");
    next();
});
////////////////////////////////////////////////

// app.get("/cookie-test", (req, res) => {
//     // session property comes from the middleware function
//     //req.session IS AN OBJECT!!! must be smaller than 4kB
//
//     //we are adding a property to the req.session object, named "cookieValue" with the value 'true'
//     req.session.cookieValue = true;
//     console.log("req.session: ", req.session);
// });

// every single route in my server (so every app.get and app.post) will have this
// req.session object

// app.use((req, res, next) => {
//     console.log(req.url);
//     next();
// });

// PART 3, the user ID must be also stored in the cookie,
// if the users is logged in and/or signed, we know it:
// {
//     req.session.signatureID: 2,
//     req.session.userId: 3
// }

// const profileRouter = require("./routers/profile");
// app.use(profileRouter);

////////////////////// ROUTES \\\\\\\\\\\\\\\\\\\\\\\\\

///////////////////// ROOT ///////////////////////
app.get("/", (req, res) => {
    res.redirect("/register");
});

///////////////////// REGISTER ///////////////////////

app.get("/register", (req, res) => {
    if (!req.session.loggedIn) {
        res.render("register", {
            layout: "main"
        });
    } else {
        res.redirect("/petition");
    }
});

app.post("/register", (req, res) => {
    bc.hashPassword(req.body.password).then(result => {
        console.log("password hashed");
        db.addUser(
            req.body.fn.trim(),
            req.body.ln.trim(),
            req.body.em.trim(),
            result
        )
            .then(rslt => {
                console.log("password added to db");
                req.session.userId = rslt.rows[0].id;
                req.session.loggedIn = true;
                req.session.alreadySigned = false;
                req.session.signatureId = null;
                console.log(req.session);
                res.redirect("/profile");
            })
            .catch(err => {
                console.log(err.constraint);
                if (err.constraint == "users_email_key") {
                    res.render("register", {
                        layout: "main",
                        error: true
                    });
                }
            });
    });
});

////////////////////////////////////////////////////////////

//////////////////////// PROFILE ///////////////////////////

app.get("/profile", (req, res) => {
    if (req.session.loggedIn) {
        console.log("/profile get IF statement before render");
        console.log("/profile GET", req.session);
        res.render("profile", {
            layout: "main",
            loggedIn: req.session.loggedIn,
            alreadySigned: req.session.alreadySigned
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/profile", (req, res) => {
    let url = req.body.url.trim();
    if (
        !url.startsWith("http://") ||
        !url.startsWith("https://") ||
        !url.startsWith("//")
    ) {
        url = "";
    }

    db.addUserInfo(
        req.body.age || null,
        req.body.city || null,
        url || null,
        req.session.userId
    ).then(() => {
        res.redirect("/petition");
    });
});

////////////////////////////////////////////////////////////

///////////////////// PETITION /////////////////////////////

// calling the middleware requireNoSignature as a callback
// app.get('/petition', requireNoSignature, (req,res)=> {
//     res,render('petition', {
//         layout:'main'
//     });
// });

app.get("/petition", (req, res) => {
    if (req.session.loggedIn) {
        Promise.all([db.getSignature(req.session.userId), db.getSignersNr()])
            .then(result => {
                // req.session.signature = result[0].rows.signature;
                console.log("/petition GET Promise results", result);
                if (req.session.alreadySigned) {
                    // req.session.alreadySigned = true;
                    res.redirect("/signed");
                } else {
                    res.render("petition_main", {
                        layout: "main",
                        signersNr: result[1].rows[0].count,
                        loggedIn: req.session.loggedIn,
                        alreadySigned: req.session.alreadySigned,
                        isPetitionPage: true
                    });
                }
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        res.redirect("/login");
    }
});

app.post("/petition", (req, res) => {
    if (req.body.signature == "") {
        db.getSignersNr().then(result => {
            res.render("petition_main", {
                layout: "main",
                signersNr: result.rows[0].count,
                loggedIn: req.session.loggedIn,
                error: true
            });
        });
    } else {
        db.addSignature(req.body.signature, req.session.userId)
            .then(signId => {
                // console.log(result.rows[0].id);
                req.session.alreadySigned = true;
                req.session.signatureId = signId.rows[0].id;

                res.redirect("/signed");
            })
            .catch(function(err) {
                console.log(err);
            });
    }
});

////////////////////////////////////////////////////////////

///////////////////// SIGNED/THANKYOU //////////////////////

app.get("/signed", (req, res) => {
    if (req.session.loggedIn) {
        if (req.session.alreadySigned) {
            let signatureUrl = "";
            Promise.all([
                db.getSignersNr(),
                db.getSignature(req.session.userId)
            ])
                .then(result => {
                    let signersNr = result[0].rows[0].count;
                    signatureUrl = result[1].rows[0].signature;
                    res.render("petition_signed", {
                        layout: "main",
                        signature: signatureUrl,
                        signersNr: signersNr,
                        alreadySigned: req.session.alreadySigned,
                        loggedIn: req.session.loggedIn,
                        isSignedPage: true
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/login");
    }
});

// app.post("/signed", (req, res) => {
//     console.log("/signed POST", req.body);
//
//     res.redirect("/deletesignature");
// });

////////////////////////////////////////////////////////////

///////////////////// DELETE SIGNATURE//////////////////////
// app.get("/deletesignature", (req, res) => {
//     console.log("/deletesignature GET", req.body);
//     res.redirect("/signed");
// });

app.post("/deletesignature", (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(result => {
            delete req.session.signatureId;
            delete req.session.alreadySigned;
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
            res.redirect("/petition");
        });
});

////////////////////////////////////////////////////////////

///////////////////// DELETE USER///////////////////////////

app.post("/deleteuser", (req, res) => {
    db.deleteUserProfile(req.session.userId)
        .then(() => {
            db.deleteSignature(req.session.userId).then(() => {
                db.deleteUser(req.session.userId).then(() => {
                    req.session = null;
                    res.redirect("/register");
                });
            });
        })
        .catch(err => {
            console.log(err);
            res.redirect("/profile/edit");
        });
});

////////////////////////////////////////////////////////////

///////////////////// SIGNERS //////////////////////////////

app.get("/signers", (req, res) => {
    if (req.session.loggedIn) {
        if (req.session.alreadySigned) {
            Promise.all([db.getUserInfo2(), db.getSignersNr()])
                .then(result => {
                    console.log("getSigners /signers,", result[0].rows);
                    res.render("petition_signers_list", {
                        layout: "main",
                        signers: result[0].rows,
                        signersNr: result[1].rows[0].count,
                        alreadySigned: req.session.alreadySigned,
                        loggedIn: req.session.loggedIn
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect("/signed");
                });
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/login");
    }
});

////////////////////////////////////////////////////////////

//////////////////////// LOGIN /////////////////////////////

app.get("/login", (req, res) => {
    if (req.session.loggedIn) {
        res.redirect("/petition");
    } else {
        res.render("login", {
            layout: "main"
        });
    }
});

app.post("/login", (req, res) => {
    db.getUserPwd(req.body.em)
        .then(result => {
            if (result.rows.length) {
                bc.checkPassword(
                    req.body.password,
                    result.rows[0].password
                ).then(result => {
                    if (result) {
                        req.session.loggedIn = true;
                        db.getUserId(req.body.em)
                            .then(result => {
                                req.session.userId = result.rows[0].id;
                                db.getSignature(req.session.userId).then(
                                    result => {
                                        if (result.rowCount != 0) {
                                            req.session.signatureId =
                                                result.rows[0].id;
                                            req.session.alreadySigned = true;
                                            console.log(
                                                "/login req.session before redirect",
                                                req.session
                                            );
                                            res.redirect("/signed");
                                        } else {
                                            res.redirect("/petition");
                                        }
                                    }
                                );
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    } else {
                        res.render("login", {
                            layout: "main",
                            loginFailed: true
                        });
                    }
                });
            } else {
                res.render("login", {
                    layout: "main",
                    areYouSure: true
                });
                console.log("result from getUserPwd: ", result.rows);
            }
        })
        .catch(err => {
            console.log(err);
        });
});

////////////////////////////////////////////////////////////

//////////////////////// PROFILE EDIT //////////////////////
let notNumber = false;
app.get("/profile/edit", (req, res) => {
    if (req.session.loggedIn) {
        console.log("/profile/edit GET", req.session);
        Promise.all([db.getInfoForEdit(req.session.userId), db.getSignersNr()])
            .then(result => {
                console.log("profile edit onload result", result[0].rows[0]);
                res.render("edit", {
                    layout: "main",
                    userInfo: result[0].rows[0],
                    signersNr: result[1].rows[0].count,
                    update: true,
                    notNumber: notNumber,
                    alreadySigned: req.session.alreadySigned,
                    loggedIn: req.session.loggedIn
                });
            })
            .catch(err => {
                console.log(err);
            });
    } else {
        res.redirect("/login");
    }
});

app.post("/profile/edit", (req, res) => {
    let url = req.body.url.trim();
    console.log(url);
    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("//")
    ) {
        console.log("url in if", url);
    } else {
        url = null;
    }
    console.log(url);

    console.log("/profile/edit POST: ", req.body);
    if (req.body.pw) {
        bc.hashPassword(req.body.pw)
            .then(result => {
                console.log("/profile/edit hash result", result);
                Promise.all([
                    db.editUser(
                        req.body.fn.trim(),
                        req.body.ln.trim(),
                        req.body.em.trim(),
                        req.session.userId
                    ),
                    db.editPassword(result, req.session.userId),
                    db.editUserProfile(
                        req.body.age,
                        req.body.city.trim(),
                        url,
                        req.session.userId
                    )
                ]).then(rslt => {
                    console.log("edit user with password promise ", rslt);
                });
            })
            .catch(err => {
                console.log(err);
                res.redirect("/profile/edit");
            });
    } else {
        console.log("no password change", req.body);
        Promise.all([
            db.editUser(
                req.body.fn.trim(),
                req.body.ln.trim(),
                req.body.em.trim(),
                req.session.userId
            ),
            db.editUserProfile(
                req.body.age,
                req.body.city.trim(),
                url,
                req.session.userId
            )
        ])
            .then(() => {
                console.log("user data updated");
                res.redirect("/profile/edit");
            })
            .catch(err => {
                console.log(err);
                res.redirect("/profile/edit");
            });
    }

    // res.redirect("/signers");
});

////////////////////////////////////////////////////////////

///////////////////// SIGNERS IN  CITY /////////////////////

app.get("/signers/:city", (req, res) => {
    if (req.session.loggedIn) {
        console.log(req.params);
        Promise.all([db.getSignersByCity(req.params.city), db.getSignersNr()])
            .then(result => {
                console.log(
                    "getSignersByCity",
                    result[0],
                    "getSignersNr",
                    result[1]
                );
                res.render("city", {
                    layout: "main",
                    city: req.params.city,
                    signersInCity: result[0].rows,
                    signersNrInCity: result[0].rows[0].count,
                    signersNr: result[1].rows[0].count,
                    alreadySigned: req.session.alreadySigned,
                    loggedIn: req.session.loggedIn
                });
            })
            .catch(err => {
                console.log(err);
                res.redirect("/signers");
            });
    } else {
        res.redirect("/login");
    }
});

// POST route, because the query is modifying the database,
// and queries that modify databases
// must be done within POST routes

// app.post("/add-city", (req, res) => {
//     // we will get the datas from the input fields
//     db.addCity("Berlin", "DE").then(() => {
//         res.redirect("/thank-you");
//     });
// });

////////////////////////////////////////////////////////////

///////////////////////// LOGOUT ///////////////////////////

app.post("/logout", (req, res) => {
    console.log("/logout POST before clearing session", req.session);
    req.session = null;
    console.log("/logout POST after clearing session", req.session);

    res.redirect("/login");
});

//////////////////////// ROUTES END /////////////////////////

//////////////////// ROUTES FOR SUPERTEST ///////////////////

// app.get("/home", (req, res) => {
//     if (!req.session.whatever) {
//         res.redirect("/register");
//     } else {
//         res.send("<h1>Home</h1>");
//     }
// });
//
// app.post("/welcome", (req, res) => {
//     //unit test to confirm if a certain cookie is set
//     req.session.submitted = true;
//     res.redirect("/registrater");
// });

if (require.main == module) {
    // if this IF block is not here, jest will always start the server
    // and the test will hang, cannot finish
    //////////////// ROUTES END FOR SUPERTEST //////////////////

    ////////////////////////////////////////////////////////////

    app.listen(process.env.PORT || 8080, () =>
        console.log("server is listening on port 8080")
    );
}

// app.use((req, res, next) => {
//     if (req.url.substr(-1) == "/") {
//         res.redirect(301, req.url.slice(0, -1));
//     } else {
//         next();
//     }
// });
