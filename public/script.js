// DOM Elements
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("input");
const sendBtn = document.getElementById("send");
const conversationList = document.getElementById("conversation-list");
let conversationId = localStorage.getItem("conversationId") || null;

/************************************************************
 * TIME-BASED GREETING
 ************************************************************/
function getGreeting() {
  const hours = new Date().getHours();
  if (hours < 12) return "Good Morning";
  if (hours < 18) return "Good Afternoon";
  return "Good Evening";
}

function updateGreeting() {
  const greetingElement = document.querySelector(".greeting h1");
  if (greetingElement) {
    greetingElement.textContent = `${getGreeting()}, Neel.`;
  }
}
document.addEventListener("DOMContentLoaded", updateGreeting);

/************************************************************
 * TIME FORMATTER
 ************************************************************/
function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/************************************************************
 * SIDEBAR COLLAPSE
 ************************************************************/
const toggleSidebar = document.getElementById("toggleSidebar");
const reopenSidebar = document.getElementById("reopenSidebar");
if (toggleSidebar) {
  toggleSidebar.addEventListener("click", () => {
    document.body.classList.add("sidebar-collapsed");
  });
}
if (reopenSidebar) {
  reopenSidebar.addEventListener("click", () => {
    document.body.classList.remove("sidebar-collapsed");
  });
}

/************************************************************
 * CODE BLOCK PARSING & COPY
 ************************************************************/
function parseCodeBlocks(text) {
  // Regex to match ```lang? code ```
  const codeBlockRegex = /```(\w+)?([\s\S]*?)```/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [fullMatch, lang, code] = match;
    const start = match.index;

    // Append text before code block
    html += text.slice(lastIndex, start);

    // Create a code block with a copy button
    const language = lang ? lang.trim() : "";
    html += `
      <div class="code-container">
        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
        <pre><code class="${language}">${escapeHtml(code.trim())}</code></pre>
      </div>
    `;
    lastIndex = codeBlockRegex.lastIndex;
  }
  // Append remaining text
  html += text.slice(lastIndex);
  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function copyCode(button) {
  const codeBlock = button.parentNode.querySelector("code");
  const codeText = codeBlock.innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    const originalText = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  });
}

/************************************************************
 * ADDING BUBBLES TO CHATBOX
 ************************************************************/
function addBubble({ text, sender = "bot", isThinking = false, timestamp = new Date() }) {
  const bubbleContainer = document.createElement("div");
  bubbleContainer.classList.add("bubble-container", sender);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = sender === "user" ? "YOU" : "GPT";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", sender);

  if (isThinking) {
    bubble.innerHTML = `
      <div style="display: flex; align-items: center;">
        <div class="spinner" style="margin-right: 0.5rem;"></div>
        LocalGPT is thinking...
      </div>
    `;
  } else {
    bubble.innerHTML = parseCodeBlocks(text);
  }

  const meta = document.createElement("span");
  meta.classList.add("chat-meta");
  meta.textContent = formatTime(timestamp);
  bubble.appendChild(meta);

  bubbleContainer.appendChild(avatar);
  bubbleContainer.appendChild(bubble);
  chatbox.appendChild(bubbleContainer);
  chatbox.scrollTop = chatbox.scrollHeight;

  if (!isThinking && typeof hljs !== "undefined") {
    hljs.highlightAll();
  }
  return bubble;
}

/************************************************************
 * SIDEBAR & CONVERSATION LOGIC
 ************************************************************/

/**
 * Fetch the list of past conversations to display in sidebar.
 */
async function loadConversations() {
  conversationList.innerHTML = "";

  // Example: GET /conversations -> returns [{ id: "abc123" }, ...]
  const res = await fetch("/conversations");
  if (!res.ok) return; // handle errors if needed
  const conversations = await res.json();

  conversations.forEach((conv) => {
    const chatItem = document.createElement("div");

    const labelSpan = document.createElement("span");
    labelSpan.classList.add("label");
    labelSpan.textContent = `Chat ${conv.id.substring(0, 8)}`;
    chatItem.appendChild(labelSpan);

    chatItem.classList.add("chat-item");
    chatItem.onclick = () => loadConversation(conv.id);

    // delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "×";
    delBtn.classList.add("delete-btn");
    delBtn.title = "Delete chat";
    delBtn.onclick = (e) => {
      e.stopPropagation(); // prevent triggering loadConversation
      deleteConversation(conv.id);
    };

    chatItem.appendChild(delBtn);
    conversationList.appendChild(chatItem);
  });
}

/**
 * Start a brand-new conversation.
 */
async function startNewChat() {
  const res = await fetch("/conversations", { method: "POST" });
  const data = await res.json();
  conversationId = data.conversationId;
  localStorage.setItem("conversationId", conversationId);

  // Clear the chatbox
  chatbox.innerHTML = "";
  // Reload the sidebar
  loadConversations();
}

/**
 * Load all messages for a specific conversation ID.
 */
async function loadConversation(id) {
  conversationId = id;
  localStorage.setItem("conversationId", conversationId);
  chatbox.innerHTML = "";

  // GET /conversations/:id -> returns an array of messages
  const res = await fetch(`/conversations/${id}`);
  if (!res.ok) return;
  const messages = await res.json();

  messages.forEach((msg) => {
    const role = msg.role === "user" ? "user" : "bot";
    addBubble({
      text: `${role === "user" ? "You" : "LocalGPT"}: ${msg.content}`,
      sender: role,
    });
  });
}

/**
 * Delete a conversation and update UI
 */
async function deleteConversation(id) {
  const confirmed = confirm("Delete this conversation?");
  if (!confirmed) return;

  await fetch(`/conversations/${id}`, { method: "DELETE" });

  // If current conversation deleted, clear chatbox and forget id
  if (conversationId === id) {
    chatbox.innerHTML = "";
    conversationId = null;
    localStorage.removeItem("conversationId");
  }

  // Refresh sidebar list
  loadConversations();
}

/************************************************************
 * SENDING MESSAGES
 ************************************************************/
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = userInput.scrollHeight + "px";
});
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // If no conversation, start one
  if (!conversationId) {
    await startNewChat();
  }

  // Show user's message
  addBubble({ text: `You: ${message}`, sender: "user" });

  // Show "thinking" bubble
  const thinkingBubble = addBubble({ isThinking: true });

  // POST /conversations/:id/messages
  const res = await fetch(`/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();

  // Remove the "thinking" bubble
  if (thinkingBubble) {
    chatbox.removeChild(thinkingBubble);
  }

  // Show the bot's response
  addBubble({ text: `LocalGPT: ${data.response}`, sender: "bot" });

  // Clear the input
  userInput.value = "";
}

/************************************************************
 * ON PAGE LOAD
 ************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  // Load the list of existing conversations in sidebar
  await loadConversations();

  // If we have a conversationId from before, load it
  if (conversationId) {
    loadConversation(conversationId);
  }

  const searchConv = document.getElementById("sidebarSearch");
  if (searchConv) {
    searchConv.addEventListener("input", () => {
      const term = searchConv.value.toLowerCase();
      [...conversationList.children].forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(term) ? "" : "none";
      });
    });
  }
});

/************************************************************
 * SPINNER CSS (Injected)
 ************************************************************/
const style = document.createElement("style");
style.innerHTML = `
.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid #999;
  border-top: 2px solid var(--color-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
`;
document.head.appendChild(style);
