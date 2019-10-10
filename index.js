const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongodb = require("mongodb");

const secretJSONToken = "faa807c4-d05e-47f3-91af-e09ec6cb80ce";
const con = "mongodb+srv://Hugo:ecGXESd8L9zdfi3@cluster0-g63l9.mongodb.net/test?retryWrites=true&w=majority";


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(express.static("static"))


async function getUserCol() {
    const connect = await mongodb.connect(con, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const db = await connect.db("chatapp");
    const col = db.collection("users");
    return col;

}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
io.on("connection", (socket) => {
    console.log("user connected");
    socket.on("disconnect", () => console.log("user disconnected"));
    socket.on("chat message", (msg) => {
        console.log(msg);
        socket.broadcast.emit("chat message", msg);
    });
});

http.listen(4200, () => console.log("4200"));
app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/register.html");
});
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/login.html")
});
app.post("/login", async (req, res) => {
    try {

        const login = req.body;
        console.log(login);
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
app.post("/registerUser", async (req, res) => {
    try {
        let user = req.body;
        const col = await getUserCol();
        const hashedPassword = await hashPassword(user.password);
        user.password = hashedPassword;
        console.log(user);
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