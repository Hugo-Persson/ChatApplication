const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongodb = require("mongodb");

const secretJSONToken = "faa807c4-d05e-47f3-91af-e09ec6cb80ce";
const con = "mongodb+srv://Hugo:ecGXESd8L9zdfi3@cluster0-g63l9.mongodb.net/test?retryWrites=true&w=majority";



app.use(express.urlencoded({
    extended: true
}));


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
app.get("/css/style.css", (req, res) => {
    res.sendFile(__dirname + "/css/style.css")
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
app.get("/css/auth.css", (req, res) => {
    res.sendFile(__dirname + "/css/auth.css");
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