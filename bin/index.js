#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import chalk from 'chalk';

import figlet from 'figlet';
import { exec, execSync } from 'child_process';
import ts from 'typescript';

function logError(error) {
  console.error(chalk.red(error));
}

function logSuccess(message) {
  console.log(chalk.green(message));
}

function createFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    logSuccess(`Created ${filePath}`);
  } catch (error) {
    logError(`Error creating ${filePath}: ${error.message}`);
  }
}

async function main() {
  console.log(chalk.blue(figlet.textSync('Express CLI')));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Select the language:',
      choices: ['TypeScript', 'JavaScript'],
    },
    {
      type: 'confirm',
      name: 'envFile',
      message: 'Do you want an .env file?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'enableCors',
      message: 'Enable CORS?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'database',
      message: 'Set up a basic database connection?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'gitignore',
      message: 'Create a .gitignore file?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'nodemon',
      message: 'Do you want to use nodemon?',
      default: false,
    }
  ]);

  const { language, envFile, enableCors, database, gitignore, nodemon } = answers;
  const ext = language === 'TypeScript' ? 'ts' : 'js';

  let tsConfig = false;
  
  if(language === 'TypeScript') {
    const tsConfigAnswer = await inquirer.prompt([
      {
        type : 'confirm',
        name : 'tsConfig',
        message : 'Do you want to create a tsconfig.json file?',
        default : false
      }
    ])
    tsConfig = tsConfigAnswer.tsConfig;
  }

  // Create project structure
  const folders = ['configs', 'middlewares', 'routes', 'controllers', 'models'];
  folders.forEach((folder) => mkdirp.sync(folder));

  // Create app file
  let appContent = `
    const express = require('express');
    ${database ? "const mongoose = require('mongoose');\n" : ''}
    ${enableCors ? "const cors = require('cors');" : ''}
    const app = express();

    ${enableCors ? "app.use(cors());" : ''}
    app.use(express.json());

    app.get('/', (req, res) => res.send('Hello World!, This was created using Express CLI'));

    ${database ? `const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/myapp';
    mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log('Database connected'))
      .catch(err => console.log('Database connection error:', err));` : ''}

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
  `;

  createFile(path.join(process.cwd(), `app.${ext}`), appContent);

  // Create .env file
  if (envFile) {
    createFile(path.join(process.cwd(), '.env'), `PORT = 3000\n${database ? 'DB_URI = mongodb://localhost:27017/myapp\n' : ''}`);
  }

  // Create gitignore file
  if (gitignore) {
    createFile(path.join(process.cwd(), '.gitignore'), 'node_modules\n.env\npackage-lock.json\n');
  }

  // Add or update package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let packageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      logError(`Error reading ${packageJsonPath}: ${error.message}`);
    }
  } else {
    packageJson = {
      name: "my-express-app",
      version: "1.0.0",
      main: `app.${ext}`,
      scripts: {},
      dependencies: {},
    };
  }

  packageJson.scripts = {
    start: `node app.${ext}`,
    ...(language === 'TypeScript' && { dev: `ts-node app.ts` }),
    ...(nodemon && { dev: `npx nodemon app.${ext}` })
  };

  // Add dependencies
  packageJson.dependencies.express = "^4.17.1";
  if (enableCors) {
    packageJson.dependencies.cors = "^2.8.5";
  }
  if (database) {
    packageJson.dependencies.mongoose = "^5.13.3";
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
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm install express', { stdio: 'inherit' });
    
    if(nodemon) execSync('npm install nodemon', { stdio: 'inherit' });

    if(language === 'TypeScript') execSync('npm install --save-dev typescript ts-node', { stdio: 'inherit' });

    if(envFile) execSync('npm install dotenv', { stdio: 'inherit' });

    if(tsConfig) execSync('npx tsc --init', { stdio: 'inherit' })

    logSuccess('Dependencies installed');
  } catch (error) {
    logError(`Error installing dependencies: ${error.message}`);
  }
  // Message after installation
  console.log(`To run the server, use: node app.${ext}`);

  if(nodemon) console.log(`To run the server in development mode, use: npm run dev`);

  console.log(`Don't forget to update the DB URL in the .env file :) `);
}

main().catch((err) => logError(`Unhandled error: ${err.message}`));
