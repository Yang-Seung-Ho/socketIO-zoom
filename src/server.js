import express from "express"
import http from "http"
//import WebSocket from "ws"
import SocketIO from "socket.io";
const { instrument } = require("@socket.io/admin-ui");
const { Server } = require("socket.io");

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));


const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true
  }
});
instrument(wsServer, {
  auth: false,
  mode: "development",
});

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome");
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);

httpServer.listen(3000, handleListen);
//app.listen(3000, handleListen);