# ArchiMate View name: ArchiScribe MCP Server

The Application and Technology components of the ArchiScribe MCP Server.
More information here: https://declanbright.com/software/archiscribe-mcp-server/

## Elements

### ArchiMate Model
- Type: Artifact
- Documentation: Any ArchiMate Model file, in the ArchiMate Exchange Format (an XML based interoperability standard).

### ArchiScribe MCP Server
- Type: ApplicationComponent
- Documentation: A Model Context Protocol (MCP) server for providing AI agents with access to information in an ArchiMate model.
- Properties:
  - Repo: https://github.com/dclnbrght/archiscribe-mcp

### MCP Interface
- Type: ApplicationInterface
- Documentation: A streamable HTTP interface.&#xD;
https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http

### AI Coding Agent
- Type: SystemSoftware
- Documentation: AI coding agent such as Github Copilot or Cursor, incorporated into a software engineer's IDE.

## Relationships

- From **ArchiScribe MCP Server** to **ArchiMate Model**
  - Type: Access

- From **MCP Interface** to **AI Coding Agent**
  - Type: Serving

- From **ArchiScribe MCP Server** to **MCP Interface**
  - Type: Composition (implicit from view nesting)
