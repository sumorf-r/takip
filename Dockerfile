FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose ports
EXPOSE 3000 8888

# Start the application with Netlify Dev
CMD ["npm", "run", "netlify"]
