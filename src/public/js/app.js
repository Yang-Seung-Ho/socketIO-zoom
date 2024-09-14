const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const roomList = document.getElementById("roomList");
const chat = document.getElementById("chat");
const chatForm = chat.querySelector("form");
const chatList = chat.querySelector("ul");

call.hidden = true;
chat.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;
let myName;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  chat.hidden = false;
  await getMedia();
  makeConnection();
}
async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const roomNameInput = welcomeForm.querySelector("#roomName");
  const nameInput = welcomeForm.querySelector("#name");
  await initCall();
  socket.emit("join_room", roomNameInput.value, nameInput.value);
  roomName = roomNameInput.value;
  myName = nameInput.value;
  roomNameInput.value = "";
  nameInput.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("welcome", async (userName) => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => {
    const { name, message } = JSON.parse(event.data);
    addMessage(`${name}: ${message}`);
  });
  console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
  addMessage(`${userName} joined the room`);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => {
      const { name, message } = JSON.parse(event.data);
      addMessage(`${name}: ${message}`);
    });
  });
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  console.log(rooms);
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = `${room.roomName} (${room.users.join(", ")})`;
    roomList.append(li);
  });
});

socket.on("bye", (userName) => {
  addMessage(`${userName} left the room`);
});

function handleChatSubmit(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  const message = input.value;
  myDataChannel.send(JSON.stringify({ name: myName, message: message }));
  addMessage(`You: ${message}`);
  input.value = "";
}

function addMessage(message) {
  const li = document.createElement("li");
  li.innerText = message;
  chatList.appendChild(li);
}

chatForm.addEventListener("submit", handleChatSubmit);

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [{   urls: [ "stun:ntk-turn-2.xirsys.com" ]}, {   username: "Ag15_u2p9QThhFcB8rViLl1UoJOkL2ygX5OnQXvOdmecZ9YSQWgUpd9RIJbftSKKAAAAAGbf8ktqdTU5Nzk=",   credential: "980014e0-6f44-11ef-b5d6-0242ac120004",   urls: [       "turn:ntk-turn-2.xirsys.com:80?transport=udp",       "turn:ntk-turn-2.xirsys.com:3478?transport=udp",       "turn:ntk-turn-2.xirsys.com:80?transport=tcp",       "turn:ntk-turn-2.xirsys.com:3478?transport=tcp",       "turns:ntk-turn-2.xirsys.com:443?transport=tcp",       "turns:ntk-turn-2.xirsys.com:5349?transport=tcp"   ]}]
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleTrack);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleTrack(data) {
  console.log("handle track")
  const peerFace = document.querySelector("#peerFace")
  peerFace.srcObject = data.streams[0]
}