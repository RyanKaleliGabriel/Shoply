#Stage 1 Bundle the files 
FROM node:18 AS builder

WORKDIR /

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2 - Run the bundled files
FROM node:18-alpine

WORKDIR /

EXPOSE 5000

COPY --from=builder /dist ./dist

COPY package*.json ./
RUN npm install

CMD ["npm", "start"]