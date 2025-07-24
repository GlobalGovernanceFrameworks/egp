# Multi-stage build for EGP Node
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY src/ ./src/
COPY test/ ./test/

# Run tests and linting
# RUN npm run test
# RUN npm run lint

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S egp && \
    adduser -S egp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy source code from builder
COPY --from=builder /app/src ./src

# Create logs directory
RUN mkdir -p /app/logs && chown -R egp:egp /app

# Switch to non-root user
USER egp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="EGP Node" \
      org.opencontainers.image.description="Reference implementation of the Emergent Governance Protocol" \
      org.opencontainers.image.source="https://github.com/ggf/egp" \
      org.opencontainers.image.licenses="CC-BY-SA-4.0" \
      org.opencontainers.image.version="0.1.0-alpha"
