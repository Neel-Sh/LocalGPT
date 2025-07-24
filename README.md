# LocalGPT Code Chat

LocalGPT Code Chat is a web-based application designed to facilitate interactive conversations with a local GPT model. The application features a user-friendly interface with a sidebar for managing chats and a main chat area for communication.

## Features

- **Sidebar Navigation**: Easily switch between conversations and start new chats.
- **Chat Interface**: Type and send messages to interact with the GPT model.
- **Syntax Highlighting**: Highlight.js is integrated for syntax highlighting in code snippets.
- **Persistent Conversations**: Conversations are stored in a SQLite database for future reference.
- **Local LLM Integration**: Communicates with a local LLM (e.g., Llama2 or CodeLlama) for generating responses.

## Project Structure

```
LocalGPT/
├── chat.db                # SQLite database file storing conversations
├── db.js                  # Database configuration and logic
├── package.json           # Node.js project metadata
├── server.js              # Backend server logic
├── public/                # Frontend assets
│   ├── index.html         # Main HTML file
│   ├── script.js          # Frontend JavaScript
│   └── styles.css         # Styling for the application
```

## API Endpoints

### 1. `GET /conversations`
- **Description**: Returns a list of all conversation IDs for the sidebar.
- **Response**: Array of conversation IDs.

### 2. `POST /conversations`
- **Description**: Starts a new conversation and returns a random ID.
- **Response**: JSON object with the new conversation ID.

### 3. `GET /conversations/:id`
- **Description**: Returns all messages for the given conversation ID.
- **Response**: Array of messages.

### 4. `POST /conversations/:id/messages`
- **Description**: Sends a message, stores user and bot messages in the database, and returns the bot's response.
- **Request Body**: `{ "message": "<user_message>" }`
- **Response**: JSON object with the bot's response.

### 5. `DELETE /conversations/:id`
- **Description**: Deletes an entire conversation.
- **Response**: JSON object with the number of deleted rows.

## Prerequisites

- Node.js (v14 or later)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd LocalGPT
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   node server.js
   ```
2. Open your browser and navigate to `http://localhost:3000`.

## Database Schema

The SQLite database contains a single table `messages` with the following schema:

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'bot'
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## License

This project is licensed under the MIT License.