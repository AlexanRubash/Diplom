FROM node:18-alpine3.17

WORKDIR /app
COPY package*.json ./
# Установить OpenSSL 1.1.x
RUN apk add --no-cache openssl

COPY . .

RUN npm run build

# Запуск миграций

CMD ["npm", "start"]
