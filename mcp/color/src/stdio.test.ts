import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const cliPath = fileURLToPath(new URL("../dist/cli.mjs", import.meta.url));

void describe("color MCP CLI", () => {
  void it("serves the built package over stdio", async () => {
    const client = new Client({ name: "color-stdio-test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliPath],
      stderr: "pipe",
    });

    await client.connect(transport);

    try {
      const result = await client.callTool({
        name: "find_max_chroma",
        arguments: { L: 0.5, h: 40 },
      });

      assert.strictEqual(result.isError, undefined);
      assert.strictEqual(Reflect.get(result.structuredContent ?? {}, "hex"), "#a93900");
    } finally {
      await client.close();
    }
  });
});
