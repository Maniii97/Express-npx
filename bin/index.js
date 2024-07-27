#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import chalk from "chalk";
import figlet from "figlet";
import { execSync } from "child_process";

function logError(error) {
  console.error(chalk.red(error));
}

function logSuccess(message) {
  console.log(chalk.green(message));
}

function createFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    logSuccess(`Created ${filePath}`);
  } catch (error) {
    logError(`Error creating ${filePath}: ${error.message}`);
  }
}

function getVersionFromNpm(packageName) {
  try {
    console.log(chalk.yellow(`Fetching version from npm...`));
    const version = execSync(`npm view ${packageName} version`, {
      encoding: "utf8",
    }).trim();
    return version;
  } catch (error) {
    console.error("Error fetching version from npm:", error.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log(chalk.blue(figlet.textSync("Express CLI")));
    console.log("");
    console.log(
      "Express CLI is a command-line utility to quickly scaffold Express.js projects."
    );
    console.log("");
    console.log("Usage: express-cli [options]");
    console.log("");
    console.log("Options:");
    console.log("-h, --help       Display help");
    console.log("-v, --version    Display version");
    console.log("");
    console.log("Example:");
    console.log(chalk.blue("npx express-i-ms -h"));
    console.log("");
    console.log(
      "To create a new Express.js project, run the command without any options."
    );
    console.log(chalk.green("npx express-i-ms"));
    console.log("");
    console.log(
      "For more information, visit: https://github.com/Maniii97/Express-npx"
    );
    console.log("");
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log(getVersionFromNpm("express-i-ms-cli"));
    return;
  }

  /*
  TODO :- add conditional to check if the user has provided a project name
  if yes then dont ask the the user to enter the project name
  if no then ask the user to enter the project name
   */

  console.log(chalk.blue(figlet.textSync("Express CLI")));

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter the project name:",
      default: ".",
    },
    {
      type: "list",
      name: "language",
      message: "Select the language:",
      choices: ["TypeScript", "JavaScript"],
    },
    {
      type: "confirm",
      name: "envFile",
      message: "Do you want an .env file?",
      default: true,
    },
    {
      type: "confirm",
      name: "enableCors",
      message: "Enable CORS?",
      default: true,
    },
    {
      type: "confirm",
      name: "database",
      message: "Set up a basic database connection?",
      default: false,
    },
    {
      type: "confirm",
      name: "gitignore",
      message: "Create a .gitignore file?",
      default: true,
    },
    {
      type: "confirm",
      name: "nodemon",
      message: "Do you want to use nodemon?",
      default: false,
    },
    {
      type: "confirm",
      name: "dockerfile",
      message: "Do you want to include a Dockerfile?",
      default: false,
    },
  ]);

  const {
    projectName,
    language,
    envFile,
    enableCors,
    database,
    gitignore,
    nodemon,
    dockerfile,
  } = answers;
  const ext = language === "TypeScript" ? "ts" : "js";

  let tsConfig = false;

  if (language === "TypeScript") {
    const tsConfigAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "tsConfig",
        message: "Do you want to create a tsconfig.json file?",
        default: false,
      },
    ]);
    tsConfig = tsConfigAnswer.tsConfig;
  }

  // Determine the project directory
  const projectDir =
    projectName === "." ? process.cwd() : path.join(process.cwd(), projectName);

  // Create the project directory if it doesn't exist
  if (projectName !== ".") {
    mkdirp.sync(projectDir);
  }

  // Create project structure
  const folders = [
    "src",
    "src/configs",
    "src/middlewares",
    "src/routes",
    "src/controllers",
    "src/models",
  ];
  folders.forEach((folder) => mkdirp.sync(path.join(projectDir, folder)));

  let dbContent = "// set up your DB connectivity here, "; // this will be inside /src/configs/db.js
  if (database && language === "TypeScript") {
    dbContent = ` 
import mongoose from "mongoose";
import { config } from "dotenv";

config();

const dbUrl = process.env.DB_URL as string;

const connectDB = async () => {
    await mongoose.connect(dbUrl)
        .then(() => console.log('Database connected'))
        .catch(err => console.error('Connection error:', err));
}

export default connectDB;`;
  }
  if (database && language === "JavaScript") {
    dbContent = 
`// set up your DB connectivity here,
const mongoose = require('mongoose');
const { config } = require('dotenv');

config();

const dbUrl = process.env.DB_URL;

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl);
        console.log('Database connected');
    } catch (err) {
        console.error('Connection error:', err);
    }
}

module.exports = connectDB;`;

  }

  createFile(path.join(projectDir, `src/configs/db.${ext}`), dbContent);
  let routeContent = "//add your router here";
  createFile(path.join(projectDir, `src/routes/login.${ext}`), routeContent);
  let controllerContent = "//add your controller here";
  createFile(
    path.join(projectDir, `src/controllers/login.${ext}`),
    controllerContent
  );
  let modelContent = "//add your model schema here";
  createFile(path.join(projectDir, `src/models/user.${ext}`), modelContent);
  let middlewareContent = "//add middleware here";
  createFile(
    path.join(projectDir, `src/middlewares/auth.${ext}`),
    middlewareContent
  );

  // Create app file
  let appContent = "";
  if (language === "JavaScript") {
    appContent = `
// this is the main server file
const express = require("express");
${database ? `const mongoose = require("mongoose");` : ""}

${enableCors ? `const cors = require("cors");` : ``}
${database ? `const connectDB = require("./configs/db");` : ""}
const app = express();

${enableCors ? `app.use(cors());` : ``}
app.use(express.json());

app.get("/", (req, res) =>
  res.send("Hello World!, This was created using Express CLI")
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  ${database ? `await connectDB();` : ""}
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`http://localhost:\${PORT}\`);
});
`;
  }
  if (language === "TypeScript") {
    appContent = `
import express, { Request, Response } from 'express';
${database ? `import connectDB from './configs/db';` : ""}
import { config } from 'dotenv';
${enableCors ? `import cors from 'cors';` : ""}

config();
const PORT = process.env.PORT || 3000;
const app = express();
${enableCors ? `
const corsOptions = { origin: "*", optionsSuccessStatus: 200};
app.use(cors(corsOptions));` : ""}

app.use(express.json());    // Parse JSON bodies to all routes

//Routes
app.get("/",(req : Request , res : Response)=>{
    res.send("Hello World! this server was made by express CLI");
});

// global catches
app.all("*", (_req, _res) => {
    _res.status(404).send("Page Not Found");
});

async function startServer() {
    ${database ? `await connectDB();` : ""}
    app.listen(PORT, () => {
        console.log(\`Server is running on port \${PORT}\`);
    });
}
startServer();

export default app;
`;
  }

  createFile(path.join(projectDir, `src/app.${ext}`), appContent);

  // Create .env file
  if (envFile) {
    createFile(
      path.join(projectDir, ".env"),
      `PORT = 3000\n${
        database ? "DB_URL = mongodb://localhost:27017/myapp\n" : ""
      }`
    );
  }

  // Create .gitignore file
  if (gitignore) {
    createFile(
      path.join(projectDir, ".gitignore"),
      `node_modules\n.env\ndist\n`
    );
  }

  // Create Dockerfile
  if (dockerfile) {
    let dockerContent = "";
    if (language === "JavaScript") {
      dockerContent = `
# Use the official Node.js image as the base image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "src/app.js"]
`;
    } else if (language === "TypeScript") {
      dockerContent = `
# Use the official Node.js image as the base image
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "dist/app.js"]
`;
    }
    createFile(path.join(projectDir, "Dockerfile"), dockerContent);
  }

  // Create tsconfig.json file
  if (tsConfig) {
    createFile(
      path.join(projectDir, "tsconfig.json"),
      `{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
`
    );
  }

  // Create package.json file
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    main: `src/app.${ext}`,
    scripts: {
      start: language === "JavaScript" ? "node src/app.js" : "ts-node src/app.ts",
      ...(language === "TypeScript" ? { build: "tsc" } : {}),
      ...(nodemon ? { dev: `nodemon src/app.${ext}` } : {}),
    },
    dependencies: {
      express: "^4.18.1",
      ...(database ? { mongoose: "^6.3.1" } : {}),
      ...(enableCors ? { cors: "^2.8.5" } : {}),
    },
    devDependencies: {
      ...(language === "TypeScript"
        ? {
            typescript: "^4.7.2",
            "ts-node": "^10.8.0",
            "@types/express": "^4.17.13",
            ...(enableCors ? { "@types/cors": "^2.8.12" } : {}),
          }
        : {}),
      ...(nodemon ? { nodemon: "^2.0.16" } : {}),
    },
  };

  createFile(
    path.join(projectDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  console.log(chalk.yellow(`Installing dependencies...`));
  execSync("npm install", { cwd: projectDir, stdio: "inherit" });
}

main();
