FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i --omit=dev && npm i -g @dotenvx/dotenvx
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD [ "dotenvx" "run" "--" "node", "dist/index.js"]