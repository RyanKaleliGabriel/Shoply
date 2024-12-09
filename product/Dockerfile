#Stage 1 - Bundle the image
FROM node:18 AS builder

WORKDIR /

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2 - Run The bundles files
FROM node:18-alpine

WORKDIR /

EXPOSE 3003

COPY --from=builder /dist ./dist

COPY package*.json ./
RUN npm install

CMD ["npm", "dev"]
