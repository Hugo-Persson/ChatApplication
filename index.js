const express = require("express");
const app = express();
const http = require("http").createServer(app);
const jwt = require("jsonwebtoken");
const mongodb = require("mongodb");
const cookieParser = require("cookie-parser");

const secretJSONToken = "faa807c4-d05e-47f3-91af-e09ec6cb80ce";
const ObjectID = mongodb.ObjectID;
const con = "mongodb+srv://Hugo:ecGXESd8L9zdfi3@cluster0-g63l9.mongodb.net/test?retryWrites=true&w=majority";


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("static"))
app.use(checkAuthMiddleware);

let db;
start();
async function start() {
    const connect = await mongodb.connect(con, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    db = await connect.db("chatapp");


    http.listen(4200, () => console.log("4200"));
    require("./io")(http, parseJsonToken, db);
    require("./router")(app, db, getUserCol, parseJsonToken, secretJSONToken);
}




async function getUserCol() {
    const col = db.collection("users");
    return col;
}

async function parseJsonToken(auth) {
    return new Promise((resolve, reject) => {
        jwt.verify(auth, secretJSONToken, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }


        })
    })

}

async function checkAuthMiddleware(req, res, next) {
    if (req.path === "/login" || req.path === "/register" || req.path === "/registerUser") {
        // Don't wanna check auth because they are probably in those routes to get auth
        next();
    } else {
        if (req.cookies.auth) {
            try {
                await parseJsonToken(req.cookies.auth);
                next();
            } catch (err) {
                console.log(err);
                res.redirect("/login");
            }
        } else {
            // Auth not present
            res.redirect("/login");
        }

    }
}