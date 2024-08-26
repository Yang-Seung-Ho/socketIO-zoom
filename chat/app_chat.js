const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const form = welcome.querySelector("form");

room.hidden = true;
let roomName;

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector('#msg input');
    const input_value = input.value;
    socket.emit("new_message", input_value, roomName, () => {
        addMessage(`You: ${input_value}`);
    });
    input.value = "";
}

// function handleNicknameSubmit(event){
//     event.preventDefault();
    
// }

function showRoom(newCount) {
    welcome.hidden = true;
    room.hidden = false;   
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`; // 사용자 수 표시  
    const msgForm = room.querySelector('#msg');    
    msgForm.addEventListener("submit", handleMessageSubmit);
    
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const roominput = form.querySelector("#roomName");
    roomName = roominput.value;  
    const nameinput = form.querySelector('#nickName');
    const nickname = nameinput.value;
    socket.emit("enter_room", roomName, nickname, (newCount) => {
    showRoom(newCount); // 사용자 수를 showRoom으로 전달
    });

    roominput.value = "";
    nameinput.value = "";
}

function addMessage(msg) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = msg;
    ul.appendChild(li);
}
form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`; 
    addMessage(`${user} 들어왔습니다.`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`; 
    addMessage(`${left} 나갔습니다.`);
});

socket.on("new_message", addMessage);
//이는 아래와 같음 

socket.on("room_change", (rooms)=> {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if (rooms.length === 0) {        
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});