#!/usr/bin/env node

import { startServer } from './api-server';

/**
 * CLI entry point for TreeSap Sandbox
 */

// Parse command line arguments
const args = process.argv.slice(2);
const config: any = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case '--port':
    case '-p':
      config.port = parseInt(args[++i]);
      break;
    case '--host':
    case '-h':
      config.host = args[++i];
      break;
    case '--base-path':
    case '-b':
      config.basePath = args[++i];
      break;
    case '--max-sandboxes':
    case '-m':
      config.maxSandboxes = parseInt(args[++i]);
      break;
    case '--cors':
      config.cors = true;
      break;
    case '--help':
      printHelp();
      process.exit(0);
    default:
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
TreeSap Sandbox Server

Usage: treesap-sandbox [options]

Options:
  -p, --port <port>            Port to listen on (default: 3000)
  -h, --host <host>            Host to bind to (default: 0.0.0.0)
  -b, --base-path <path>       Base path for sandbox folders (default: ./.sandboxes)
  -m, --max-sandboxes <num>    Maximum number of sandboxes (default: 100)
  --cors                       Enable CORS (default: false)
  --help                       Show this help message

Examples:
  treesap-sandbox --port 8080
  treesap-sandbox --base-path /tmp/sandboxes --cors
  treesap-sandbox -p 3000 -m 50
  `);
}

// Start the server
startServer(config).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
