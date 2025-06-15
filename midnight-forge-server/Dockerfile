# Use Node.js official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy the contract dependency first
COPY ../contract ./contract

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the development server with watch mode
CMD ["npm", "run", "dev"] 