# Testing Guide

This guide shows you how to test the TreeSap Sandbox v1.0 API.

## Prerequisites

Make sure you have Node.js 18+ installed.

## Quick Start

### 1. Start the Server

Open a terminal and run:

```bash
cd packages/treesap-sandbox
npm run dev
```

You should see:
```
🌳 TreeSap Sandbox Server starting...
📁 Base path: /path/to/.sandboxes
🚀 Server listening on http://0.0.0.0:3000
```

### 2. Test with Examples

#### Option A: Client SDK Example (Recommended)

In a **new terminal**:

```bash
cd packages/treesap-sandbox
npx tsx examples/client-example.ts
```

This tests:
- ✅ Creating a sandbox
- ✅ Executing commands
- ✅ Writing files
- ✅ Reading files
- ✅ Listing files
- ✅ Streaming command output
- ✅ Background processes
- ✅ Process log streaming
- ✅ Sandbox status
- ✅ Deleting files
- ✅ Destroying sandbox

#### Option B: AI Agent Example

```bash
npx tsx examples/ai-agent-example.ts
```

This demonstrates:
- ✅ Python script execution
- ✅ Installing dependencies
- ✅ Reading results
- ✅ Git repository cloning
- ✅ Multi-step workflows

#### Option C: REST API Test Script

```bash
./test-api.sh
```

Tests all REST endpoints with curl.

## Manual Testing

### Test 1: Health Check

```bash
curl http://localhost:3000/
```

Expected response:
```json
{
  "status": "ok",
  "service": "TreeSap Sandbox",
  "version": "1.0.0",
  "stats": {
    "totalSandboxes": 0,
    "maxSandboxes": 100,
    "totalProcesses": 0,
    "basePath": "./.sandboxes",
    "autoCleanup": true
  }
}
```

### Test 2: Create a Sandbox

```bash
curl -X POST http://localhost:3000/sandbox
```

Expected response:
```json
{
  "id": "abc-123-def",
  "workDir": "/path/to/.sandboxes/abc-123-def",
  "createdAt": 1234567890
}
```

**Save the `id` for next tests!**

### Test 3: Execute a Command

Replace `{SANDBOX_ID}` with your sandbox ID:

```bash
curl -X POST http://localhost:3000/sandbox/{SANDBOX_ID}/exec \
  -H "Content-Type: application/json" \
  -d '{"command":"echo Hello World"}'
```

Expected response:
```json
{
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0
}
```

### Test 4: Write a File

```bash
curl -X POST http://localhost:3000/sandbox/{SANDBOX_ID}/files/hello.txt \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello, TreeSap!"}'
```

### Test 5: Read the File

```bash
curl http://localhost:3000/sandbox/{SANDBOX_ID}/files/hello.txt
```

Expected response:
```json
{
  "content": "Hello, TreeSap!"
}
```

### Test 6: List Files

```bash
curl "http://localhost:3000/sandbox/{SANDBOX_ID}/files?path=."
```

Expected response:
```json
{
  "files": [
    {
      "name": "hello.txt",
      "path": "hello.txt",
      "type": "file",
      "size": 14,
      "mtime": 1234567890
    }
  ]
}
```

### Test 7: Stream Command Output

```bash
curl "http://localhost:3000/sandbox/{SANDBOX_ID}/exec-stream?command=echo%20Streaming"
```

Expected response (Server-Sent Events):
```
data: {"type":"start","timestamp":1234567890}

data: {"type":"stdout","data":"Streaming\n","timestamp":1234567890}

data: {"type":"complete","exitCode":0,"timestamp":1234567890}
```

### Test 8: Start a Background Process

```bash
curl -X POST http://localhost:3000/sandbox/{SANDBOX_ID}/process \
  -H "Content-Type: application/json" \
  -d '{"command":"sleep 5 && echo Done"}'
```

Expected response:
```json
{
  "id": "process-123",
  "pid": 12345,
  "command": "sleep 5 && echo Done",
  "status": "running",
  "startTime": 1234567890
}
```

### Test 9: List Processes

```bash
curl http://localhost:3000/sandbox/{SANDBOX_ID}/process
```

### Test 10: Destroy Sandbox

```bash
curl -X DELETE "http://localhost:3000/sandbox/{SANDBOX_ID}?cleanup=true"
```

Expected response:
```json
{
  "success": true
}
```

## Testing with TypeScript

Create a test file `my-test.ts`:

```typescript
import { SandboxClient } from '@treesap/sandbox';

async function test() {
  // Create sandbox
  const sandbox = await SandboxClient.create('http://localhost:3000');
  console.log('Sandbox ID:', sandbox.id);

  // Test command execution
  const result = await sandbox.exec('node --version');
  console.log('Node version:', result.stdout.trim());

  // Test file operations
  await sandbox.writeFile('test.json', JSON.stringify({ foo: 'bar' }));
  const content = await sandbox.readFile('test.json');
  console.log('File content:', content);

  // Cleanup
  await sandbox.destroy({ cleanup: true });
  console.log('Test completed!');
}

test().catch(console.error);
```

Run it:
```bash
npx tsx my-test.ts
```

## Testing Streaming

Create `test-streaming.ts`:

```typescript
import { SandboxClient, parseSSEStream } from '@treesap/sandbox';

async function testStreaming() {
  const sandbox = await SandboxClient.create('http://localhost:3000');

  // Stream a long-running command
  const stream = await sandbox.execStream('for i in 1 2 3 4 5; do echo "Line $i"; sleep 1; done');

  console.log('Streaming output:');
  for await (const event of parseSSEStream(stream)) {
    if (event.type === 'stdout') {
      console.log('  ->', event.data?.trim());
    } else if (event.type === 'complete') {
      console.log('  -> Completed with exit code:', event.exitCode);
    }
  }

  await sandbox.destroy({ cleanup: true });
}

testStreaming().catch(console.error);
```

Run it:
```bash
npx tsx test-streaming.ts
```

## Troubleshooting

### Server won't start

**Issue**: Port 3000 already in use

**Solution**: Use a different port
```bash
npx tsx src/cli.ts --port 8080
```

### Permission errors

**Issue**: Cannot create sandbox directories

**Solution**: Check write permissions or use a different base path
```bash
npx tsx src/cli.ts --base-path /tmp/sandboxes
```

### Commands fail

**Issue**: Command not found (e.g., `python`, `git`)

**Solution**: Make sure the required tools are installed on your system. The sandbox runs commands on your host machine.

## Next Steps

After testing:

1. ✅ Build the package: `npm run build`
2. ✅ Check the generated types: `ls dist/`
3. ✅ Test the CLI: `node dist/cli.js --help`
4. 🚀 Integrate into your project!

## Integration Example

```typescript
// In your project
import { startServer, SandboxClient } from '@treesap/sandbox';

// Start server
const { server, manager } = await startServer({ port: 3000 });

// Use client
const sandbox = await SandboxClient.create('http://localhost:3000');
await sandbox.exec('npm install');
await sandbox.destroy({ cleanup: true });
```

## Performance Testing

To test with multiple sandboxes:

```typescript
import { SandboxClient } from '@treesap/sandbox';

async function loadTest() {
  const sandboxes = await Promise.all(
    Array.from({ length: 10 }, () =>
      SandboxClient.create('http://localhost:3000')
    )
  );

  console.log('Created 10 sandboxes');

  // Execute commands in parallel
  await Promise.all(
    sandboxes.map(s => s.exec('echo test'))
  );

  // Cleanup
  await Promise.all(
    sandboxes.map(s => s.destroy({ cleanup: true }))
  );

  console.log('Load test completed!');
}

loadTest().catch(console.error);
```

## Questions?

- Check the [README](./README.md) for API documentation
- See [examples/](./examples/) for more examples
- Open an issue on GitHub
