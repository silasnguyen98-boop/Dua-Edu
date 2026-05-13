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

# Build-time env needed by Next.js while collecting page data
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

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
EXPOSE 3007
CMD ["npm", "start"]
