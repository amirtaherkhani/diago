# Diago Helm chart

This chart runs Diago's Streamable HTTP MCP server on Kubernetes.

## Install

```bash
helm upgrade --install diago ./charts/diago \
  --namespace diago \
  --create-namespace \
  --wait

helm test diago --namespace diago
```

The default private service endpoints are:

- `http://diago.diago.svc/mcp`
- `http://diago.diago.svc/artifacts/<name>.html`
- `http://diago.diago.svc/livez`
- `http://diago.diago.svc/readyz`

## Important values

| Value | Default | Purpose |
| --- | --- | --- |
| `image.repository` | `ghcr.io/amirtaherkhani/diago` | Container registry and image |
| `image.tag` | `latest` | Image tag; pin `image.digest` in production |
| `auth.existingSecret` | empty | Secret containing the optional bearer token |
| `auth.secretKey` | `token` | Token key inside the Secret |
| `mcp.allowedOrigins` | `[]` | Exact browser Origins allowed to call the service |
| `mcp.maxSessions` | `1000` | Maximum in-memory MCP sessions |
| `persistence.enabled` | `false` | Persist rendered HTML under `/data` |
| `ingress.enabled` | `false` | Expose `/mcp` and `/artifacts` through an Ingress |

The chart enforces one replica because MCP sessions are held in process memory. It also requires bearer authentication before enabling Ingress, NodePort, or LoadBalancer exposure.

See the full [Kubernetes and MCP client guide](../../docs/kubernetes.md).
