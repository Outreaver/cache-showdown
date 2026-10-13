FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
# Serves the production build; vite.config.ts proxies /api to $API_URL.
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
