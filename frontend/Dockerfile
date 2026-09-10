FROM node:26-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host expõe o servidor do Vite para fora do container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
