# Copyright (c) 2026 Clove Twilight
# Licensed under the ESAL-1.3 Licence.
# See LICENCE.md in the project root for full licence information.

FROM node:25-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install --ignore-scripts && npm rebuild

COPY . .
RUN npm run build

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/ || exit 1

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4000"]