# Используем официальный образ Node.js для фронтенда
FROM node:18 AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Копируем остальные файлы
COPY . .
# Устанавливаем зависимости
RUN npx update-browserslist-db@latest
# Строим приложение
RUN npm run build

# Экспонируем порт
EXPOSE 3000

# Запускаем фронтенд
CMD ["npm", "start"]
