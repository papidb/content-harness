curl -X POST "https://opencode.ai/zen/go/v1/messages" \
  -H "x-api-key: sk-A0gOkGf5JPesCqI05TiwOGwIcsCF6QvSWlEem5y9PUM4M3frR8aHodaLmcLbMvDj" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "minimax-m3",
    "max_tokens": 200,
    "messages": [
      {
        "role": "user",
        "content": "Hello, explain your architecture in one sentence."
      }
    ],
    "temperature": 0.7
  }'
