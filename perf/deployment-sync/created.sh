curl --header "Content-Type: application/json" \
  --request POST \
  --data @webhook-request-examples/test-studio-created.json \
  http://localhost:3000/api/vercel-webhook-receive
