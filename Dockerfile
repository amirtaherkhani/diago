FROM node:22-alpine

LABEL org.opencontainers.image.title="Diago" \
      org.opencontainers.image.description="Evidence-grounded software engineering diagram MCP server" \
      org.opencontainers.image.source="https://github.com/amirtaherkhani/diago" \
      org.opencontainers.image.licenses="MIT"

RUN addgroup -S -g 10001 diago \
    && adduser -S -D -H -u 10001 -G diago diago \
    && mkdir -p /app /data \
    && chown -R 10001:10001 /app /data

WORKDIR /app

COPY --chown=10001:10001 package.json LICENSE ./
COPY --chown=10001:10001 knowledge ./knowledge
COPY --chown=10001:10001 lib ./lib
COPY --chown=10001:10001 mcp ./mcp
COPY --chown=10001:10001 schemas ./schemas
COPY --chown=10001:10001 vendor ./vendor

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DIAGO_OUTPUT_ROOT=/data

USER 10001:10001

EXPOSE 3000
VOLUME ["/data"]
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/livez').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "mcp/http-server.mjs"]
