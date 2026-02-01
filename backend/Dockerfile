FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src src
COPY public public
COPY datasets datasets

EXPOSE 8000
CMD ["npm", "start"]
