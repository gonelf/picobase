FROM node:18-alpine

# Install wget and unzip for PocketBase download
RUN apk add --no-cache wget unzip

# Download and install PocketBase
WORKDIR /tmp
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip \
    && unzip pocketbase_0.22.0_linux_amd64.zip \
    && chmod +x pocketbase \
    && mv pocketbase /usr/local/bin/ \
    && rm pocketbase_0.22.0_linux_amd64.zip

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
