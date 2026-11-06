# LocalGPT Code Chat

A local web chat interface backed by Express, SQLite, and an Ollama model. Conversations are saved in `chat.db`; the browser provides a conversation sidebar and code highlighting.

## Setup

Install Node.js/npm and Ollama, then:

```sh
git clone https://github.com/Neel-Sh/LocalGPT.git
cd LocalGPT
npm ci
```

The server currently targets **Ollama on port 11500** with the model **`llama2`**, rather than Ollama's usual default port. In a separate terminal:

```sh
OLLAMA_HOST=127.0.0.1:11500 ollama serve
```

Then download the configured model and start the app:

```sh
OLLAMA_HOST=127.0.0.1:11500 ollama pull llama2
npm start
```

Open [localhost:3000](http://localhost:3000). The endpoint and model are currently configured in `server.js`.

## Behavior and storage

- `GET /conversations` lists conversations with saved messages.
- `POST /conversations` creates an ID; it appears in history after a message is stored.
- `GET /conversations/:id` reads messages.
- `POST /conversations/:id/messages` sends one prompt to Ollama and stores both sides.
- `DELETE /conversations/:id` deletes saved messages for that conversation.

The current inference request sends the new message only; saved conversation history is not included in model context. `chat.db` and its journal files are local runtime data and stay ignored. The server has no authentication and binds using Express's default listener, so keep it on a trusted local machine and do not expose it publicly.

## Development

`npm run check` checks JavaScript syntax. There is no automated behavioral test suite. `public/` contains the browser UI, `server.js` the HTTP API, and `db.js` the SQLite setup. See [Contributing](CONTRIBUTING.md).

The package metadata declares ISC, but this repository does not include a standalone license file. Earlier README references to MIT were inconsistent with that metadata.
