#!/usr/bin/env node

import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createColorServer } from "./server.ts";

void serveStdio(createColorServer);
