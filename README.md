# ArchiScribe MCP Server

A Model Context Protocol (MCP) server for requesting information from an ArchiMate model. MCP tools are used to search and retrieve information from views within the configured model.

The MCP can be used during the SDLC, to provide architectural context directly to engineers using AI coding assistants/agents with MPC server integration. The architecture details are provided to the coding assistant in markdown format which is easily understood by modern LLMs.

***The configured model file must be in the ArchiMate Exchange File format.***

## Installation

Install dependencies:

```powershell
npm install
```

## Running the Server

### Development Mode (Recommended for development)

Run with automatic restart on file changes:

```powershell
npm run dev
```

This uses `ts-node-dev` to run the TypeScript source directly and restart automatically when files change.

### Production Mode

Build and run the compiled JavaScript:

```powershell
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start in development mode with auto-restart
- `npm run build` - Compile TypeScript to JavaScript in `dist/` folder
- `npm start` - Start the compiled server from `dist/mcp/index.js`
- `npm test` - Run the test suite

### Server Configuration

The server will start on port 3030 by default. You can override this by:

1. **Environment variable**: Set `SERVER_PORT` environment variable
   ```powershell
   $env:SERVER_PORT=8080; npm start
   ```

2. **Config file**: Edit `config/settings.json` and change the `serverPort` value

Model file (ArchiMate) configuration

The path to the ArchiMate model file is configured with the `modelPath` key in `config/settings.json` or via the `MODEL_PATH` environment variable. The server requires a model path to be set and will throw an error if none is provided.

- Example (config file):

```json
{
  "modelPath": "data/archimate-scribe-demo-model.xml"
}
```

- Example (PowerShell, environment variable):

```powershell
$env:MODEL_PATH='C:\path\to\your\model.xml'; npm start
```

Notes:

- The value may be an absolute path or a path relative to the project root. The default demo model shipped with the repo is `data/archimate-scribe-demo-model.xml`.
- After changing `config/settings.json` or setting `MODEL_PATH`, restart the server so the new value is picked up.

### Verifying the Server

Once started, you should see output like:
```
MCP SDK: using high-level McpServer API
MCP: registered high-level tool: SearchViews
MCP: registered high-level tool: GetViewDetails
Server listening on port 3030
```

## MCP Tools

This server provides two MCP tools:

- **SearchViews**: Search view names in the ArchiMate model
  - Input: `query` (optional string) - search keyword to filter view names
  - Output: Markdown list of matching view names

- **GetViewDetails**: Get detailed information for a specific view
  - Input: `viewname` (required string) - exact name of the view
  - Output: Markdown document with view metadata, elements, and relationships

## HTTP API (for testing)

The server also exposes HTTP endpoints for quick testing:

- GET `/views?q=<keyword>`
  - Returns a Markdown list of view names that match the optional keyword
  - Example:

```powershell
Invoke-RestMethod -Uri "http://localhost:3030/views?q=dataflow" -Method Get
```

- GET `/views/{viewname}`
  - Returns a Markdown document with view metadata, elements, and relationships
  - Example:

```powershell
Invoke-RestMethod -Uri "http://localhost:3030/views/Dataflow" -Method Get
```

## MCP Transport

The server supports MCP over HTTP at the `/mcp` endpoint for integration with MCP clients.

### Example config in VS Code
```json
  "archiscribe": {
    "url": "http://localhost:3030/mcp",
    "type": "http"
  }
```

## Configuration

- Server configuration is in `config/settings.json` 
- Default port: 3030
- Model file: `src/data/archimate-scribe-demo-model.xml`
- View filtering can be configured via `viewsFilterByProperty` and `viewsFilterPropertyName` settings

