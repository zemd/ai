import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";

import { createColorServer } from "./server.ts";

void describe("color MCP server", () => {
  void it("lists and calls both color tools over MCP", async () => {
    const server = createColorServer();
    const client = new Client({ name: "color-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      assert.strictEqual(client.getServerVersion()?.name, "@zemd/color-mcp");

      const { tools } = await client.listTools();
      assert.deepStrictEqual(tools.map(({ name }) => name).sort(), [
        "convert_color",
        "find_max_chroma",
      ]);

      const conversion = await client.callTool({
        name: "convert_color",
        arguments: { color: { notation: "hex", hex: "#ff0000" } },
      });
      assert.strictEqual(conversion.isError, undefined);
      assert.strictEqual(Reflect.get(conversion.structuredContent ?? {}, "hex"), "#ff0000");

      const maximum = await client.callTool({
        name: "find_max_chroma",
        arguments: { L: 0.5, h: 40 },
      });
      assert.strictEqual(maximum.isError, undefined);
      assert.ok(
        Math.abs(
          Number(Reflect.get(maximum.structuredContent ?? {}, "maxChroma")) - 0.15690744224771497,
        ) <
          0.5 * 10 ** -10,
      );
    } finally {
      await client.close();
      await server.close();
    }
  });
});
