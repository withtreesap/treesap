#!/usr/bin/env node
/**
 * TreeSap Terminal CLI
 * Start a terminal server from the current directory
 */

import { startTerminalServer } from './server.js';

// Parse command line arguments
const args = process.argv.slice(2);
let port = 4000;
let host = 'localhost';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--port' || arg === '-p') {
    const portArg = args[++i];
    if (portArg) {
      port = parseInt(portArg, 10);
      if (isNaN(port)) {
        console.error('Error: Invalid port number');
        process.exit(1);
      }
    }
  } else if (arg === '--host' || arg === '-h') {
    const hostArg = args[++i];
    if (hostArg) {
      host = hostArg;
    }
  } else if (arg === '--help') {
    console.log(`
TreeSap Terminal CLI

Usage:
  npx @treesap/terminal [options]

Options:
  --port, -p <port>    Port to run the server on (default: 4000)
  --host, -h <host>    Host to bind to (default: localhost)
  --help               Show this help message

Examples:
  npx @treesap/terminal
  npx @treesap/terminal --port 3000
  npx @treesap/terminal --host 0.0.0.0 --port 8080
`);
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    console.error('Run with --help for usage information');
    process.exit(1);
  }
}

// Start the server with the current working directory
console.log(`Starting terminal server from: ${process.cwd()}`);

startTerminalServer({
  port,
  host,
  cors: true
}).catch((error) => {
  console.error('Failed to start terminal server:', error);
  process.exit(1);
});
