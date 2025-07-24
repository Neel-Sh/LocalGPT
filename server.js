// OLLAMA_HOST=127.0.0.1:11500 ollama serve 

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// 1. Serve the static files in "public" folder
app.use(express.static(path.join(__dirname, "public")));

/**
 * 2. GET /conversations
 *    Return a list of all conversation IDs for the sidebar.
 */
app.get("/conversations", (req, res) => {
  const query = `
    SELECT DISTINCT conversation_id AS id
    FROM messages
    ORDER BY id ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // rows might look like: [ { id: "abc123" }, { id: "xyz789" } ]
    res.json(rows);
  });
});

/**
 * 3. POST /conversations
 *    Start a new conversation and return a random ID.
 */
app.post("/conversations", (req, res) => {
  const conversationId = Math.random().toString(36).substr(2, 9);
  res.json({ conversationId });
});

/**
 * 4. GET /conversations/:id
 *    Return all messages for the given conversation.
 */
app.get("/conversations/:id", (req, res) => {
  const { id: conversationId } = req.params;
  const query = `
    SELECT *
    FROM messages
    WHERE conversation_id = ?
    ORDER BY timestamp ASC
  `;
  db.all(query, [conversationId], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

/**
 * 5. POST /conversations/:id/messages
 *    Send a message, store user & bot messages in DB, return bot's response.
 */
app.post("/conversations/:id/messages", async (req, res) => {
  const { id: conversationId } = req.params;
  const userMessage = req.body.message;

  // Save user message
  db.run(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES (?, 'user', ?)`,
    [conversationId, userMessage],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
    }
  );

  try {
    // Call Ollama or your local LLM
    const response = await axios.post("http://localhost:11500/api/generate", {
      model: "llama2",     
      //model: "codellama",
      prompt: userMessage,
      stream: false,
    });

    const botReply = response.data.response;

    // Save bot message
    db.run(
      `INSERT INTO messages (conversation_id, role, content)
       VALUES (?, 'bot', ?)`,
      [conversationId, botReply],
      function (err) {
        if (err) return res.status(500).json({ error: "Database error" });
      }
    );

    res.json({ response: botReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ response: "Error processing your request." });
  }
});

/**
 * 6. DELETE /conversations/:id
 *    Delete an entire conversation (optional).
 */
app.delete("/conversations/:id", (req, res) => {
  db.run(
    `DELETE FROM messages WHERE conversation_id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ deletedRows: this.changes });
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 LocalGPT server running at http://localhost:${PORT}`);
});
