import express from "express"
import http from "http"
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

const rooms = new Map();

function publicRooms() {
  const publicRooms = [];
  rooms.forEach((value, key) => {
    publicRooms.push({ roomName: key, users: Array.from(value.values()) });
  });
  return publicRooms;
}

function updateRoomList() {
  wsServer.sockets.emit("room_change", publicRooms());
}

wsServer.on("connection", (socket) => {
  updateRoomList();

  socket.on("join_room", (roomName, userName) => {
    socket.join(roomName);
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Map());
    }
    rooms.get(roomName).set(socket.id, userName);
    socket.to(roomName).emit("welcome", userName);
    updateRoomList();
  });

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });

  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });

  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      if (rooms.has(room)) {
        const userName = rooms.get(room).get(socket.id);
        rooms.get(room).delete(socket.id);
        if (rooms.get(room).size === 0) {
          rooms.delete(room);
        } else {
          socket.to(room).emit("bye", userName);
        }
      }
    });
    updateRoomList();
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);

httpServer.listen(3000, handleListen);