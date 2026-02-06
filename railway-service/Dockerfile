FROM node:18-alpine

# Install curl, unzip, and ca-certificates for secure downloads
# libc6-compat is needed for PocketBase (Go binary) on Alpine
RUN apk add --no-cache curl unzip ca-certificates libc6-compat

# Download and install PocketBase
WORKDIR /tmp
RUN curl -L -o pocketbase.zip https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip \
    && unzip pocketbase.zip \
    && chmod +x pocketbase \
    && mv pocketbase /usr/local/bin/ \
    && rm pocketbase.zip

# Setup application
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

# Create directory for PocketBase instances
RUN mkdir -p /app/instances

# Expose port
EXPOSE 3000

CMD ["node", "index.js"]
