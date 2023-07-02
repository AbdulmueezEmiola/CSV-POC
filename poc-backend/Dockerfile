FROM node:18.15.0

LABEL version="1.0"
LABEL description="This is the base docker image for the backend of the app"
LABEL maintainer = ["emiolaabdulmueez@gmail.com"]

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]