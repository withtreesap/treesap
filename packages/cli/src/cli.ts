#!/usr/bin/env node
import { runTreesapCli } from "./index.js";

const exitCode = await runTreesapCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (message) => {
    console.log(message);
  },
  stderr: (message) => {
    console.error(message);
  },
});

if (exitCode !== 0) {
  process.exit(exitCode);
}
