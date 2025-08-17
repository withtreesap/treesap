#!/usr/bin/env node

import { program } from 'commander';
import { startServer, type TreesapConfig } from './server.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import process from 'node:process';

async function loadConfig(): Promise<TreesapConfig> {
    const configFileName = 'treesap.config.ts';
    const configFileNameJs = 'treesap.config.js';

    // Check if we have a specific project directory set via environment variable
    const projectDir = process.env.TREESAP_PROJECT_DIR || process.cwd();
    const configFilePath = path.join(projectDir, configFileName);
    const configFilePathJs = path.join(projectDir, configFileNameJs);

    let configToLoad = configFilePath;
    if (!fs.existsSync(configFilePath) && fs.existsSync(configFilePathJs)) {
        configToLoad = configFilePathJs;
    }

    if (fs.existsSync(configToLoad)) {
        try {
            console.log(`Loading configuration from ${configToLoad}`);
            const absoluteConfigPath = path.resolve(configToLoad);
            const configModule = await import(`file://${absoluteConfigPath}`);
            const config = configModule.default || {};
            return config;
        } catch (error) {
            console.error(`Error loading ${path.basename(configToLoad)}:`, error);
            return {};
        }
    } else {
        console.log(`No treesap.config.ts or treesap.config.js found. Using default configuration.`);
        return {};
    }
}

async function startCommand(options: any) {
    // Load config from project directory (set via env var or current directory)
    const config = await loadConfig();

    // Set projectRoot to the project directory where config was found
    const projectDir = process.env.TREESAP_PROJECT_DIR || process.cwd();
    config.projectRoot = projectDir;

    // Override config with CLI options
    if (options.port) config.port = parseInt(options.port);
    if (options.previewPort) config.previewPort = parseInt(options.previewPort);
    if (options.devPort) config.devPort = parseInt(options.devPort);
    if (options.devCommand) config.devCommand = options.devCommand;

    // Don't auto-start dev server for basic start command
    config.autoStartDev = false;

    startServer(config);
}

async function devCommand(options: any) {
    // Load config from project directory (set via env var or current directory)
    const config = await loadConfig();

    // Set projectRoot to the project directory where config was found
    const projectDir = process.env.TREESAP_PROJECT_DIR || process.cwd();
    config.projectRoot = projectDir;

    // Override config with CLI options
    if (options.port) config.port = parseInt(options.port);
    if (options.previewPort) config.previewPort = parseInt(options.previewPort);
    if (options.devPort) config.devPort = parseInt(options.devPort);
    if (options.devCommand) config.devCommand = options.devCommand;

    // Always auto-start dev server for dev command
    config.autoStartDev = true;

    startServer(config);
}

async function initCommand(projectName: string) {
    const projectPath = path.join(process.cwd(), projectName);
    
    if (fs.existsSync(projectPath)) {
        console.error(`Directory ${projectName} already exists!`);
        process.exit(1);
    }

    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Create basic treesap.config.ts
    const configContent = `import type { TreeSapConfig } from 'treesap';

const config: TreeSapConfig = {
    port: 1234,
    previewPort: 8080,
    projectRoot: process.cwd(),
    devCommand: "npm run dev",
    devPort: 8080,
};

export default config;
`;

    fs.writeFileSync(path.join(projectPath, 'treesap.config.ts'), configContent);

    // Create basic package.json
    const packageJsonContent = {
        "name": projectName,
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "dev": "echo 'Add your dev command here'",
            "build": "echo 'Add your build command here'"
        },
        "dependencies": {
            "treesap": "^1.0.0"
        }
    };

    fs.writeFileSync(
        path.join(projectPath, 'package.json'), 
        JSON.stringify(packageJsonContent, null, 2)
    );

    console.log(`✅ TreeSap project '${projectName}' created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm install`);
    console.log(`  treesap start`);
}

program
    .name('treesap')
    .description('TreeSap - Real-time chat application framework')
    .version('1.0.0');

program
    .command('start')
    .description('Start the TreeSap server')
    .option('-p, --port <port>', 'Port to run the server on')
    .option('--preview-port <port>', 'Port for the preview server')
    .option('--dev-port <port>', 'Port for the dev server')
    .option('--dev-command <command>', 'Command to run the dev server')
    .action(startCommand);

program
    .command('dev')
    .description('Start the TreeSap server with dev server auto-start')
    .option('-p, --port <port>', 'Port to run the server on')
    .option('--preview-port <port>', 'Port for the preview server')
    .option('--dev-port <port>', 'Port for the dev server')
    .option('--dev-command <command>', 'Command to run the dev server')
    .action(devCommand);

program
    .command('init <project-name>')
    .description('Initialize a new TreeSap project')
    .action(initCommand);

program.parse();