const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const form = welcome.querySelector("form");

room.hidden = true;
let roomName;

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;   
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`; 
}
function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  roomName = input.value;
  socket.emit("enter_room", input.value, showRoom());
  input.value = "";
}

function addMessage(msg) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = msg;
    ul.appendChild(li);
}
form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", () => {
    addMessage("누군가 들어왔습니다.");
});