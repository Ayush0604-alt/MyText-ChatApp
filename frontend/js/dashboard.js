// ============================
// INITIALIZATION
// ============================
const API_URL = "https://mytext-chatapp-1.onrender.com";

console.log("Dashboard JS Loaded");

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
  window.location.href = "auth.html";
}

document.getElementById("currentUsername").innerText = user.username;

const socket = io(API_URL);
socket.emit("setup", user);

let unreadCounts = {};
let onlineUsers = [];
let currentChat = null;
let typingTimeout = null;

// ============================
// ONLINE SYSTEM
// ============================

socket.on("onlineUsers", (users) => {
  onlineUsers = users;
  updateOnlineStatusUI();
});

socket.on("userOnline", (userId) => {
  if (!onlineUsers.includes(userId)) onlineUsers.push(userId);
  updateOnlineStatusUI();
});

socket.on("userOffline", (userId) => {
  onlineUsers = onlineUsers.filter((id) => id !== userId);
  updateOnlineStatusUI();
});

// ============================
// LOAD CHATS
// ============================

const chatList = document.getElementById("chatList");

async function loadChats() {
  const res = await fetch(`${api}/api/chats`, {
    headers: { Authorization: "Bearer " + token },
  });

  const chats = await res.json();
  chatList.innerHTML = "";

  chats.forEach((chat) => {
    const otherUser = chat.participants.find(
      (p) => p._id !== user._id
    );

    const div = document.createElement("div");
    div.classList.add("chat-item");

   div.innerHTML = `
  <div class="chat-left">
    <img src="${otherUser.avatar || 'https://via.placeholder.com/40'}" 
         class="avatar-small">
    <span class="chat-username">${otherUser.username}</span>
  </div>

  <div class="chat-right">
    <span class="unread-badge" id="unread-${chat._id}">
      ${unreadCounts[chat._id] ? unreadCounts[chat._id] : ""}
    </span>
  </div>
`;

    div.addEventListener("click", () => openChat(chat));
    chatList.appendChild(div);
  });

  updateOnlineStatusUI();
}

loadChats();

// ============================
// UPDATE ONLINE UI
// ============================

function updateOnlineStatusUI() {
  document.querySelectorAll(".user-status-dot").forEach((dot) => {
    const id = dot.id.replace("status-", "");

    if (onlineUsers.includes(id)) {
      dot.classList.remove("offline-dot");
      dot.classList.add("online-dot");
    } else {
      dot.classList.remove("online-dot");
      dot.classList.add("offline-dot");
    }
  });

  if (currentChat) {
    const otherUser = currentChat.participants.find(
      (p) => p._id !== user._id
    );

    const status = document.getElementById("chatStatus");

    if (onlineUsers.includes(otherUser._id)) {
      status.innerText = "Online";
      status.style.color = "#00c853";
    } else {
      status.innerText = "Offline";
      status.style.color = "#999";
    }
  }
}

// ============================
// OPEN CHAT
// ============================

function openChat(chat) {
  currentChat = chat;

  const otherUser = chat.participants.find(
    (p) => p._id !== user._id
  );

  document.getElementById("chatUsername").innerText =
    otherUser.username;

    document.getElementById("chatAvatar").src =
  otherUser.avatar || "https://via.placeholder.com/45";
 unreadCounts[chat._id] = 0;

const badge = document.getElementById(`unread-${chat._id}`);
if (badge) badge.innerText = "";
  socket.emit("joinChat", chat._id);

  loadMessages(chat._id);
  markAsSeen(chat._id);
}
// ============================
// SEARCH USERS
// ============================

const userSearchInput = document.getElementById("userSearch");

userSearchInput.addEventListener("input", async (e) => {

  const value = e.target.value.trim();

  if (!value) {
    loadChats();
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/api/users?search=${value}`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    if (!res.ok) {
      console.log("Search failed:", res.status);
      return;
    }

    const users = await res.json();
    renderSearchResults(users);

  } catch (error) {
    console.error("Search error:", error);
  }

});
function renderSearchResults(users) {

  chatList.innerHTML = "";

  users.forEach((userItem) => {

    const div = document.createElement("div");
    div.classList.add("chat-item");

    div.innerHTML = `
      <div class="chat-left">
        <img src="${userItem.avatar || 'https://via.placeholder.com/40'}" 
             class="avatar-small">
        <span class="chat-username">${userItem.username}</span>
      </div>
    `;

    div.addEventListener("click", () => {
      createOrOpenChat(userItem._id);
    });

    chatList.appendChild(div);
  });

}
async function createOrOpenChat(userId) {

  const res = await fetch(`${API_URL}/api/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ userId }),
  });

  const chat = await res.json();

  openChat(chat);
  loadChats();
}
// ============================
// LOGOUT SYSTEM
// ============================

document.getElementById("logoutBtn").addEventListener("click", () => {
  socket.disconnect();
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "auth.html";
});
// ============================
// LOAD MESSAGES
// ============================

const messagesContainer = document.getElementById("messages");

async function loadMessages(chatId) {
  const res = await fetch(
    `${API_URL}/api/messages/${chatId}`,
    { headers: { Authorization: "Bearer " + token } }
  );

  const messages = await res.json();
  messagesContainer.innerHTML = "";

  messages.forEach((msg) => addMessageToUI(msg));

  scrollToBottom();
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================
// RENDER MESSAGE
// ============================

function addMessageToUI(msg) {
  const div = document.createElement("div");
  div.classList.add("message");

  const isSender = msg.senderId._id === user._id;

  if (isSender) div.classList.add("sent");
  else div.classList.add("received");

  div.innerHTML = `
    ${msg.text}
    ${
      isSender
        ? `<span class="tick ${msg.seen ? "seen" : ""}">✔✔</span>`
        : ""
    }
  `;

  messagesContainer.appendChild(div);
  scrollToBottom();
}

// ============================
// SEND MESSAGE
// ============================

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentChat) return;

  const res = await fetch(`${API_URL}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      chatId: currentChat._id,
      text,
    }),
  });

  const message = await res.json();
  addMessageToUI(message);

  messageInput.value = "";
}

// ============================
// REAL-TIME MESSAGE RECEIVE
// ============================

socket.on("messageReceived", (newMessage) => {

  const chatId = newMessage.chatId._id;

  // If chat is NOT open → increase unread
  if (!currentChat || currentChat._id !== chatId) {

    if (!unreadCounts[chatId]) unreadCounts[chatId] = 0;
    unreadCounts[chatId]++;

    const badge = document.getElementById(`unread-${chatId}`);
    if (badge) {
      badge.innerText = unreadCounts[chatId];
    }

  } else {
    addMessageToUI(newMessage);
    markAsSeen(chatId);
  }

});

// ============================
// TYPING SYSTEM
// ============================

messageInput.addEventListener("input", () => {
  if (!currentChat) return;

  socket.emit("typing", {
    chatId: currentChat._id,
    senderId: user._id,
  });

  clearTimeout(typingTimeout);

  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping", {
      chatId: currentChat._id,
      senderId: user._id,
    });
  }, 1000);
});

socket.on("typing", () => {
  document.getElementById("typingIndicator").innerText =
    "Typing...";
});

socket.on("stopTyping", () => {
  document.getElementById("typingIndicator").innerText = "";
});

// ============================
// SEEN SYSTEM
// ============================

async function markAsSeen(chatId) {
  await fetch(`${API_URL}/api/messages/seen`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ chatId }),
  });
}

socket.on("messagesSeen", () => {
  loadMessages(currentChat._id);
});
const profileAvatar = document.getElementById("profileAvatar");
const avatarInput = document.getElementById("avatarInput");

// Set initial avatar
profileAvatar.src = user.avatar || "https://via.placeholder.com/50";

// Click avatar to open file picker
profileAvatar.addEventListener("click", () => {
  avatarInput.click();
});

// When image selected
avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onloadend = async () => {
    const base64Image = reader.result;

    const res = await fetch(`${API_URL}/api/users/avatar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ image: base64Image }),
    });

    const data = await res.json();

    if (res.ok) {
      profileAvatar.src = data.avatar;
      user.avatar = data.avatar;
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      alert(data.message);
    }
  };

  reader.readAsDataURL(file);
});