#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import {mkdirp} from "mkdirp";
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
    const version = execSync(`npm view ${packageName} version`, { encoding: 'utf8' }).trim();
    return version;
  } catch (error) {
    console.error('Error fetching version from npm:', error.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    console.log(chalk.blue(figlet.textSync('Express CLI')));
    console.log('');
    console.log('Express CLI is a command-line utility to quickly scaffold Express.js projects.');
    console.log('');
    console.log('Usage: express-cli [options]');
    console.log('');
    console.log('Options:');
    console.log('-h, --help       Display help');
    console.log('-v, --version    Display version');
    console.log('');
    console.log('Example:');
    console.log(chalk.blue('npx express-i-ms -h'));
    console.log('');
    console.log('To create a new Express.js project, run the command without any options.');
    console.log(chalk.green('npx express-i-ms'));
    console.log('');
    console.log('For more information, visit: https://github.com/Maniii97/Express-npx');
    console.log('');
    return;
  }
  if(args.includes('--version')||args.includes('-v')){ 
    console.log(getVersionFromNpm('express-i-ms-cli'));
    return;
  }

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

  // Create app file
  let appContent = `
    // this is the main server file
    const express = require('express');
    ${database ? "const mongoose = require('mongoose');\n" : ""}
    ${enableCors ? "const cors = require('cors');" : ""}
    const app = express();

    ${enableCors ? "app.use(cors());" : ""}
    app.use(express.json());

    app.get('/', (req, res) => res.send('Hello World!, This was created using Express CLI'));

    ${
      database
        ? `const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/myapp';
    mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log('Database connected'))
      .catch(err => console.log('Database connection error:', err));`
        : ""
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
  `;

  createFile(path.join(projectDir, `src/app.${ext}`), appContent);

  // Create .env file
  if (envFile) {
    createFile(
      path.join(projectDir, ".env"),
      `PORT = 3000\n${
        database ? "DB_URI = mongodb://localhost:27017/myapp\n" : ""
      }`
    );
  }

  // Create .gitignore file
  if (gitignore) {
    createFile(
      path.join(projectDir, ".gitignore"),
      "node_modules\n.env\npackage-lock.json\n"
    );
  }

  // Create Dockerfile if needed
  if (dockerfile) {
    const dockerfileContent = `
      # Use official Node.js LTS image
      FROM node:18

      # Set working directory
      WORKDIR /usr/src/app

      # Copy package.json and package-lock.json
      COPY package*.json ./

      # Install dependencies
      RUN npm install

      # Copy the rest of the application code
      COPY . .

      # Expose the application port
      EXPOSE 3000

      # Start the application
      CMD ["npm", "start"]
    `;
    createFile(path.join(projectDir, "Dockerfile"), dockerfileContent);

    // Create .dockerignore file
    const dockerignoreContent = `
      node_modules
      npm-debug.log
      Dockerfile
      .dockerignore
    `;
    createFile(path.join(projectDir, ".dockerignore"), dockerignoreContent);
  }

  // Create README.md
  const readmeContent = `
    # ${projectName}

    ## Description
    This is a project generated by the Express CLI.

    ## Installation
    \`\`\`sh
    npm install
    \`\`\`

    ## Usage
    \`\`\`sh
    npm start
    \`\`\`

    ## Development
    \`\`\`sh
    npm run dev
    \`\`\`
  `;
  createFile(path.join(projectDir, "README.md"), readmeContent);

  // Add or update package.json
  const packageJsonPath = path.join(projectDir, "package.json");
  let packageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    } catch (error) {
      logError(`Error reading ${packageJsonPath}: ${error.message}`);
    }
  } else {
    const defaultName =
      projectName === "." ? path.basename(process.cwd()) : projectName;
    packageJson = {
      name: defaultName,
      version: "1.0.0",
      main: `src/app.${ext}`,
      scripts: {},
      dependencies: {},
    };
  }

  packageJson.scripts = {
    start: `node src/app.${ext}`,
    ...(language === "TypeScript" && { dev: `ts-node src/app.ts` }),
    ...(nodemon && { dev: `npx nodemon src/app.${ext}` }),
  };

  // Add dependencies
  packageJson.dependencies.express = "^4.17.1";
  if (enableCors) {
    packageJson.dependencies.cors = "^2.8.5";
  }
  if (database) {
    packageJson.dependencies.mongoose = "^5.13.3";
  }
  if (envFile) {
    packageJson.dependencies.dotenv = "^10.0.0";
  }
  if (language === "TypeScript") {
    packageJson.devDependencies = {
      typescript: "^4.3.5",
      "ts-node": "^10.2.1",
    };
  }
  if (nodemon) {
    packageJson.devDependencies.nodemon = "^2.0.12";
  }

  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    logSuccess(`Updated ${packageJsonPath}`);
  } catch (error) {
    logError(`Error updating ${packageJsonPath}: ${error.message}`);
  }

  // Install dependencies
  console.log(chalk.blue("Installing dependencies..."));
  try {
    execSync("npm install", { stdio: "inherit", cwd: projectDir });
    logSuccess("Dependencies installed");
  } catch (error) {
    logError(`Error installing dependencies: ${error.message}`);
  }

  if (tsConfig) {
    try {
      execSync("npx tsc --init", { stdio: "inherit", cwd: projectDir });
      logSuccess("TypeScript configuration file created");
    } catch (error) {
      logError(`Error creating TypeScript configuration: ${error.message}`);
    }
  }
  // Message after installation
  console.log(`To run the server, use: node src/app.${ext}\n`);

  if (nodemon) console.log(`To run the server in development mode, use: npm run dev`);

  console.log(`Don't forget to update the DB URL in the .env file :)`);
}

main().catch((err) => logError(`Unhandled error: ${err.message}`));
