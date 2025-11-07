#!/bin/bash

# TreeSap Sandbox API Test Script
# Make sure the server is running first: npm run dev

echo "🧪 Testing TreeSap Sandbox API"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"

# 1. Health check
echo "1. Health Check..."
curl -s $BASE_URL | jq '.'
echo ""

# 2. Create a sandbox
echo "2. Creating sandbox..."
RESPONSE=$(curl -s -X POST $BASE_URL/sandbox)
echo $RESPONSE | jq '.'
SANDBOX_ID=$(echo $RESPONSE | jq -r '.id')
echo "Created sandbox: $SANDBOX_ID"
echo ""

# 3. Get sandbox status
echo "3. Getting sandbox status..."
curl -s $BASE_URL/sandbox/$SANDBOX_ID | jq '.'
echo ""

# 4. Write a file
echo "4. Writing a file..."
curl -s -X POST $BASE_URL/sandbox/$SANDBOX_ID/files/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from TreeSap Sandbox!"}' | jq '.'
echo ""

# 5. List files
echo "5. Listing files..."
curl -s "$BASE_URL/sandbox/$SANDBOX_ID/files" | jq '.'
echo ""

# 6. Read the file
echo "6. Reading file..."
curl -s $BASE_URL/sandbox/$SANDBOX_ID/files/test.txt | jq '.'
echo ""

# 7. Execute a command
echo "7. Executing command: ls -la"
curl -s -X POST $BASE_URL/sandbox/$SANDBOX_ID/exec \
  -H "Content-Type: application/json" \
  -d '{"command":"ls -la"}' | jq '.'
echo ""

# 8. Execute another command
echo "8. Executing command: echo Hello"
curl -s -X POST $BASE_URL/sandbox/$SANDBOX_ID/exec \
  -H "Content-Type: application/json" \
  -d '{"command":"echo Hello World"}' | jq '.'
echo ""

# 9. List all sandboxes
echo "9. Listing all sandboxes..."
curl -s $BASE_URL/sandbox | jq '.'
echo ""

# 10. Destroy sandbox
echo "10. Destroying sandbox..."
curl -s -X DELETE "$BASE_URL/sandbox/$SANDBOX_ID?cleanup=true" | jq '.'
echo ""

echo "✅ API test completed!"
