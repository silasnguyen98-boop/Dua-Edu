# 1. Base image with Node.js
FROM node:20-slim

# 2. Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# 3. Install Python libraries
COPY requirements.txt ./
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# 4. Install Node.js dependencies
COPY package*.json ./
RUN npm install

# 5. Copy project files
COPY . .

# 6. Build Next.js app
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 7. Start the app
EXPOSE 3000
CMD ["npm", "start"]
