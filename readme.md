# Express CLI

![Express](https://img.shields.io/badge/Express.js-^4.17.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-^4.5.4-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

express-i-ms-cli is a command-line interface (CLI) tool for quickly generating Express.js projects with multiple customizable options.

## Installation

You can install `express-i-ms-cli` globally using npm:

To install : 
```bash
npm i express-i-ms-cli
```

Help command : 
```bash
npx express-i-ms -h
```
OR
```bash
npx express-i-ms --help
```

Version command : 
```bash
npx express-i-ms -v
```
OR
```bash
npx express-i-ms --version
```

Make an empty folder, Run the following command to get the boilerplate express app with MVC architecture pattern.
```bash
npx express-i-ms
```
## This is how your project structure will look like:

```
projectName/
├── src/
│   ├── app.ts
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middlewares/
│   └── configs/
├── .dockerignore
├── .gitignore
├── Dockerfile
├── README.md
├── package.json
├── tsconfig.json
```

## Features

- Choose between TypeScript and JavaScript for your project.
- Option to include an .env file for environment variables.
- Option to enable CORS (Cross-Origin Resource Sharing).
- Set up a basic database connection with MongoDB.
- Option to include .gitignore file.
- Option to get ts-config.json file.
- Option to use nodemon.
- Option to add a DockerFile


Feel free to raise an issue and contribute to this package on [Github](https://github.com/Maniii97/Express-npx)
