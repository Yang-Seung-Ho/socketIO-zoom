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
    const form = room.querySelector('form');
    form.addEventListener("submit", handleMessageSubmit);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector('input');
    const input_value = input.value;
    socket.emit("new_message", input_value, roomName, () => {
        addMessage(`You: ${input_value}`);
    });
    input.value = "";
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

socket.on("bye", () => {
    addMessage("누군가 나갔습니다.");
});

socket.on("new_message", (msg) => {
    addMessage(`다른 사용자 : ${msg}`);
});
//이는 아래와 같음 

//socket.on("new_message", addMessage)