# ArchiScribe MCP Server

The **ArchiScribe MCP Server** is a Model Context Protocol (MCP) server designed to query and retrieve architectural information from an ArchiMate model. It enables AI coding assistants and agents to access architectural context during the software development lifecycle (SDLC), delivering model insights in markdown format, ideal for modern language models.

> **Note:** The model file must be in the **ArchiMate Exchange File (.xml)** format.

---

## Example

Here is a simple example from the demo model (/data/archimate-scribe-demo-model.xml).

This view depicts the ArchiScribe MCP Server reading a model file and Serving an AI Coding Agent, via it's MCP interface.

- [ArchiScribe MCP Server raw output](/data/archiScribe-MCP-Server-view.md)
- [AI generated documentation from the output](/data/archiscribe-MCP-Server-documentation.md)

![archiscribe-archimate-view](/img/archiscribe-archimate-view.png)

---

## Installation

Install dependencies:

```bash
npm install
```

---

## Running the Server

### Production Mode

Compile and run the server:

```bash
npm run build
npm start
```

### Development Mode

Run with automatic restart on file changes:

```bash
npm run dev
```

Uses `ts-node-dev` to execute TypeScript directly and restart on changes.

---

## Available Scripts

| Script             | Description                                      |
|--------------------|--------------------------------------------------|
| `npm run dev`      | Start in development mode with auto-restart      |
| `npm run build`    | Compile TypeScript to JavaScript in `dist/`      |
| `npm start`        | Run the compiled server from `dist/mcp/index.js` |
| `npm test`         | Execute the test suite                           |

---

## Configuration

### Server Port

Default port: `3030`. You can override it via:

- **Environment variable**:
  ```powershell
  $env:SERVER_PORT=8080; npm start
  ```

- **Config file**: Edit `config/settings.json`:
  ```json
  {
    "serverPort": 8080
  }
  ```

### Model File Path

Specify the path to your ArchiMate model via:

- **Environment variable**:
  ```powershell
  $env:MODEL_PATH='C:\path\to\your\model.xml'; npm start
  ```

- **Config file**:
  ```json
  {
    "modelPath": "data/your-model.xml"
  }
  ```

Supports both absolute and relative paths. Restart the server after changes.

---

## Verifying the Server

On successful startup, you should see:

```
MCP SDK: using high-level McpServer API
MCP: registered high-level tool: SearchViews
MCP: registered high-level tool: GetViewDetails
Server listening on port 3030
```

---

## MCP Tools

The server exposes two MCP tools:

### SearchViews

- **Input**: `keyword` (optional string) — keyword to filter view names
- **Output**: Markdown list of matching views

### GetViewDetails

- **Input**: `viewname` (required string) — exact name of the view
- **Output**: Markdown document with metadata, elements, and relationships

---

## HTTP API

Quick testing via HTTP endpoints:

- GET `/views?q=<keyword>`
  - Returns a markdown list of view names matching the keyword.

- GET `/views/{viewname}`
  - Returns detailed markdown for the specified view.

---

## MCP Transport

Supports MCP over HTTP at the `/mcp` endpoint for integration with MCP clients.

### VS Code Configuration

```json
"archiscribe": {
  "url": "http://localhost:3030/mcp",
  "type": "http"
}
```

---

## Advanced Configuration

- Config file: `config/settings.json`
- Default model file: `src/data/archimate-scribe-demo-model.xml`
- Optional view filtering, based on a property set on views in the model:
  ```json
  {
    "viewsFilterByProperty": true,
    "viewsFilterPropertyName": "yourPropertyName"
  }
  ```

---
