const express = require("express");
const app = express();
const http = require("http").createServer(app);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");
const cookieParser = require("cookie-parser");
const secretJSONToken = "faa807c4-d05e-47f3-91af-e09ec6cb80ce";
const ObjectID = mongodb.ObjectID;
const con = "mongodb+srv://Hugo:ecGXESd8L9zdfi3@cluster0-g63l9.mongodb.net/test?retryWrites=true&w=majority";

http.listen(4200, () => console.log("4200"));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("static"))
app.use(checkAuthMiddleware);
require("./io")(http, parseJsonToken, getDb);





app.get("/", async (req, res) => {
    let chat = req.query.chat;
    if (!(chat)) {
        chat = "All";
    }
    try {
        const data = await parseJsonToken(req.cookies.auth);
        const db = await getDb();
        const chatsMongo = await db.collection("chats");
        const currentChat = await chatsMongo.findOne({
            name: chat
        });
        const userCol = await getUserCol();
        const user = await userCol.findOne({
            username: data.data.username
        });

        const chats = user.chats.map(item => {
            return `<a href="/?chat=${item}"> <li class="${item===chat?"currentChat":""}" >${item}</li></a>`

        });
        const chatMessages = currentChat.messages.map(value => {
            return `<li><spand class="message">${value.msg}</span><br>
            <span class="from">from ${value.user}</span></li>`;
        });
        res.render("index.ejs", {
            chats: chats.join(""),
            chat: chat,
            messages: chatMessages.join("")

        });
    } catch (err) {
        res.redirect("/login");
        console.log("err")
        console.log(err);
    }

});


app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/register.html");
});
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html")
});
app.post("/login", async (req, res) => {
    try {
        const login = req.body;
        const col = await getUserCol();
        const user = await col.findOne({
            username: login.username
        })

        if (user) {
            //not undefined
            if (await bcrypt.compare(login.password, user.password)) {
                // Log in true
                const credentials = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 3),
                    data: {
                        username: user.username
                    }
                }, secretJSONToken)
                res.json({
                    auth: credentials,
                    error: false
                });
            } else {
                res.json({
                    error: true,
                    msg: "Wrong password"
                })

            }
        } else {
            //Undefined
            res.json({
                error: true,
                msg: "Couldn't find user"
            })
        }

    } catch (err) {
        console.log(err);
    }
});
app.get("/newChat", async (req, res) => {
    try {
        const authData = await parseJsonToken(req.cookies.auth);
        const userCol = await getUserCol();
        const users = await userCol.find().toArray();
        const options = users.map(val => {
            return `<option value="${val.username}">${val.username}</option>`
        });

        res.render("newChat", {
            options: options
        });

    } catch (err) {
        console.log(err);

    }



});
app.post("/registerUser", async (req, res) => {
    try {
        let user = req.body;
        //Adding all chat
        user.chats = ["All", "Random Chat"];

        const col = await getUserCol();
        const hashedPassword = await hashPassword(user.password);
        user.password = hashedPassword;
        await col.insertOne(user);
        res.send("success");
    } catch (err) {
        console.log(err);
        res.send("error");
    }


});

async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (err) {
        console.log(err);
    }

}
async function getUserCol() {
    const db = await getDb();
    const col = db.collection("users");
    return col;
}
async function getDb() {
    const connect = await mongodb.connect(con, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const db = await connect.db("chatapp");
    return db;
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
    if (req.path === "/login" || req.path === "/register") {
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