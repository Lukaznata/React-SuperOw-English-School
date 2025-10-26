FROM node:22.12
WORKDIR /app
COPY . .
RUN rm -rf node_modules package-lock.json && npm install
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]