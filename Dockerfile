FROM node:16

# Setting the working directory in the container, to where things will be copied to and run from
WORKDIR /usr/src/app

# Copying the necessary files to build the app into the container image
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
