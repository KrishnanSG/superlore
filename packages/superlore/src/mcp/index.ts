/**
 * superlore MCP — serves the structured knowledge index to agents. The content model and the MCP
 * are designed together (ARCHITECTURE §4): the same data the human site renders is exposed as
 * tools (`search`, `get_page`, `get_section`, `list`, `navigate`, `get_component_data`).
 */
export * from "./query";
export * from "./server";
