module.exports = async function (http, parseJsonToken, db) {
    const io = require("socket.io")(http);

    let sockets = [];
    io.on("connection", async (socket) => {
        try {
            const handshake = socket.handshake.query;
            const auth = handshake.auth;
            const chat = handshake.chat;
            const decryptedData = await parseJsonToken(auth);

            const chats = await db.collection("chats");

            sockets.push({
                chat: chat,
                socket: socket
            });

            socket.on("disconnect", () => sockets.splice(sockets.find(item => item.socket === socket), 1));
            socket.on("chat message", (msg) => {
                chats.updateOne({
                    name: chat
                }, {
                    $push: {
                        messages: {
                            msg: msg,
                            user: decryptedData.data.username
                        }
                    }
                });
                sockets.map(value => {
                    if (value.chat === chat && value.socket !== socket) {
                        console.log("itt");

                        value.socket.emit("chat message", JSON.stringify({
                            msg: msg,
                            username: decryptedData.data.username
                        }));
                    }
                })
                /* socket.broadcast.emit("chat message", JSON.stringify({
                    msg: msg,
                    username: decryptedData.data.username
                })); */
            });
        } catch (err) {
            console.log(err);
        }

    });

}