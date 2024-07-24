import express from "express"
import http from "http"
//import WebSocket from "ws"
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

// socket.io 사용
wsServer.on("connection", (socket) => {
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
      });
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);
        done;
        socket.to(roomName).emit("welcome");
    });
    // 끊어지기 전에 메시지 전송 가능
    socket.on("disconnecting", () => {
      socket.rooms.forEach(room => socket.to(room).emit("bye"));
    });

    // 메시지 받기
    socket.on("new_message", (msg, room, done)=> {
      socket.to(room).emit("new_message", msg);
      done();
    })
});
  








// 웹 소켓 사용
// const wss = new WebSocket.Server({server})

// function handleConnection(socket) {
//     console.log(socket);
// }

// const sockets = [];


// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "익명";
//     console.log("브라우저 연결");
//     socket.on("close", ()=> console.log("브라우저 연결 끊김"));
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         switch (message.type) {
//           case "new_message":
//             sockets.forEach((aSocket) =>
//               aSocket.send(`${socket.nickname}: ${message.payload}`)
//             );
//           case "nickname":
//             socket["nickname"] = message.payload;
//         }
//     });
// });


httpServer.listen(3000, handleListen);
//app.listen(3000, handleListen);