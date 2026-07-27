# Run Diago MCP on Kubernetes

The `charts/diago` Helm chart runs Diago as a Streamable HTTP MCP server. It exposes:

- `POST /mcp` for MCP requests and notifications;
- `DELETE /mcp` for session termination;
- `GET /artifacts/<name>.html` for rendered diagrams;
- `GET /livez` and `GET /readyz` for Kubernetes probes;
- `/data` for rendered standalone HTML artifacts.

The plugin installation still uses the local stdio server. Use this chart when an MCP client needs to reach one shared Diago service over HTTP.

## Install

Clone the repository and install the chart:

```bash
git clone https://github.com/amirtaherkhani/diago.git
cd diago

helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --create-namespace \
  --wait
```

The default image is `ghcr.io/amirtaherkhani/diago:latest`. Pin an immutable digest for a production deployment:

```bash
helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --create-namespace \
  --set image.digest=sha256:YOUR_IMAGE_DIGEST \
  --set image.pullPolicy=IfNotPresent \
  --wait
```

Verify the workload:

```bash
kubectl -n diago rollout status deployment/diago
kubectl -n diago get pods,service
helm test diago --namespace diago
kubectl -n diago port-forward service/diago 3000:80
```

In another terminal:

```bash
curl --fail http://127.0.0.1:3000/livez
curl --fail http://127.0.0.1:3000/readyz
```

## Protect the endpoint

The Service is a private `ClusterIP` by default. Before enabling an Ingress or LoadBalancer, create a bearer-token Secret:

```bash
kubectl create namespace diago --dry-run=client -o yaml | kubectl apply -f -
kubectl -n diago create secret generic diago-auth \
  --from-literal=token='REPLACE_WITH_A_LONG_RANDOM_TOKEN'

helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --set auth.existingSecret=diago-auth \
  --wait
```

The chart refuses to render an enabled Ingress, NodePort, or LoadBalancer unless `auth.existingSecret` is configured. Put TLS in front of every endpoint that leaves the cluster. `mcp.allowedOrigins` controls browser Origins; it is not authentication.

Example Ingress values:

```yaml
auth:
  existingSecret: diago-auth

mcp:
  allowedOrigins:
    - https://engineering.example.com

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: diago.example.com
      paths:
        - path: /mcp
          pathType: Exact
        - path: /artifacts
          pathType: Prefix
  tls:
    - secretName: diago-tls
      hosts:
        - diago.example.com
```

Apply them with:

```bash
helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --values diago-production.yaml \
  --wait
```

## Connect Codex

For a local port-forward without bearer authentication:

```bash
codex mcp add diago-k8s --url http://127.0.0.1:3000/mcp
codex mcp list
```

For a protected endpoint, keep the token in an environment variable:

```bash
export DIAGO_MCP_TOKEN='REPLACE_WITH_THE_SECRET_VALUE'
codex mcp add diago-k8s \
  --url https://diago.example.com/mcp \
  --bearer-token-env-var DIAGO_MCP_TOKEN
codex mcp list
```

Start a new Codex thread and ask:

```text
Use the Diago MCP tools to advise, plan, validate, and render an architecture view for this feature.
```

## Connect Claude Code

For a local port-forward without bearer authentication:

```bash
claude mcp add --transport http diago-k8s http://127.0.0.1:3000/mcp
claude mcp get diago-k8s
```

For a protected endpoint, add the authorization header through your secret-management workflow:

```bash
claude mcp add --transport http diago-k8s https://diago.example.com/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
claude mcp get diago-k8s
```

Avoid committing literal tokens. Claude Code also supports environment-variable expansion in project MCP configuration.

## Test the MCP endpoint directly

Initialize a session and save the response headers:

```bash
curl --silent --show-error \
  --dump-header /tmp/diago-mcp-headers \
  --output /tmp/diago-mcp-initialize.json \
  http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"curl","version":"1.0.0"}}}'

DIAGO_SESSION_ID="$(
  awk 'tolower($1) == "mcp-session-id:" {gsub("\r", "", $2); print $2}' \
    /tmp/diago-mcp-headers
)"
```

List Diago's five tools:

```bash
curl --silent --show-error http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "MCP-Session-Id: ${DIAGO_SESSION_ID}" \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

Call the advisor:

```bash
curl --silent --show-error http://127.0.0.1:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "MCP-Session-Id: ${DIAGO_SESSION_ID}" \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  --data '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"advise_diagram","arguments":{"task":"Trace an idempotent checkout request"}}}'
```

Add `-H "Authorization: Bearer ${DIAGO_MCP_TOKEN}"` to each `/mcp` request when bearer authentication is enabled.

## Persist rendered diagrams

Without persistence, `/data` is an `emptyDir`, so artifacts disappear when the Pod is replaced. Enable a chart-managed PersistentVolumeClaim:

```bash
helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --set persistence.enabled=true \
  --set persistence.size=5Gi \
  --wait
```

Or use an existing claim:

```bash
helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --set persistence.enabled=true \
  --set persistence.existingClaim=engineering-diagrams \
  --wait
```

Call `render_diagram` with an output path below `/data`, such as `/data/checkout.html`. The server rejects paths and symlink escapes outside that directory.

Retrieve that artifact through the service:

```bash
curl --fail --output checkout.html \
  http://127.0.0.1:3000/artifacts/checkout.html
```

Add the bearer-token header when authentication is enabled. Artifact responses are HTML-only, protected by the same authentication and Origin checks as `/mcp`, and served with a restrictive browser sandbox policy.

## Operational limits

- Keep `replicaCount: 1`. MCP sessions are stored in process memory, and the chart enforces this limit.
- A rollout or Pod restart ends active sessions; MCP clients must reconnect and initialize again.
- Rendering is synchronous and CPU-bound. Tune `resources` for the size and frequency of diagrams.
- `mcp.maxSessions` limits in-memory MCP sessions; inactive sessions expire after `mcp.sessionTtlMs`.
- Keep the endpoint private unless TLS and authentication are configured.
- Pin `image.digest` for repeatable production rollouts.

Review all options in [`values.yaml`](../charts/diago/values.yaml).
