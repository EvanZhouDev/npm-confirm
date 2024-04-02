#!/usr/bin/env node

import { detect } from "../detect-package-manager.js"
import select from '@inquirer/select';
import chalk from "chalk";
import { execa } from 'execa';

let args = process.argv.slice(2);

let current = "npm"

// add ability to only source certain package managers
if (args[0] === "--shellcode") {
    args = args.slice(1);
    let aliases = {
        npm: "alias npm='npmc'",
        pnpm: "alias pnpm='npmc --pnpm-alias'",
        bun: "alias bun='npmc --bun-alias'",
        yarn: "alias yarn='npmc --yarn-alias'"
    };
    if (args.length === 0) {
        for (let alias in aliases) {
            console.log(aliases[alias]);
        }
    } else {
        for (let arg of args) {
            if (aliases[arg]) {
                console.log(aliases[arg]);
            }
        }
    }
    process.exit(0);
}

if (args[0] === "--pnpm-alias") {
    args.shift();
    current = "pnpm"
}
if (args[0] === "--bun-alias") {
    args.shift();
    current = "bun"
}
if (args[0] === "--yarn-alias") {
    args.shift();
    current = "yarn"
}

const confirmBlockList = ["-v", "--version", "help", "-h", "--help"]


for (let blockedWord of confirmBlockList) {
    if (args.includes(blockedWord)) {
        try {
            await execa(current, args, { stdio: 'inherit' })
        } catch (e) { console.log(e.originalMessage) }
        process.exit(0)
    }
}


const pm = await detect();

if (pm === "none") {
    try {
        await execa(current, args, { stdio: 'inherit' })
    } catch (e) { console.log(e.originalMessage) }
    process.exit(0)
}

const pmInfo = {
    "bun": {
        "color": "magentaBright",
        "name": "Bun",
        "add": ["add", "a"],
        "global": ["-g", "--global"],
        "dev": ["-d", "--development"],
        "frozen": ["--no-save"],
        "upgrade": ["update"],
        "uninstall": ["remove", "r"],
    },
    "pnpm": {
        "color": "yellowBright",
        "name": "PNPM",
        "add": ["add"],
        "global": ["-g", "--global"],
        "dev": ["-D", "--dev"],
        "frozen": ["--frozen-lockfile"],
        "upgrade": ["update", "up", "upgrade"],
        "uninstall": ["remove", "rm", "uninstall", "un"],
    },
    "yarn": {
        "color": "blueBright",
        "name": "Yarn",
        "add": ["add"],
        "global": [], // Yarn Berry doesn't have global installation
        "dev": ["-D", "--dev"],
        "frozen": ["--immutable"],
        "upgrade": ["up"],
        "uninstall": ["remove"],
    },
    "npm": {
        "color": "redBright",
        "name": "NPM",
        "add": ["i", "add", "in", "inst", "insta", "instal", "install", "isnt", "insta", "isntal", "isntall"],
        "global": ["-g", "--global"],
        "dev": ["-D", "--save-dev", "--dev"],
        "frozen": ["ci", "clean-install", "ic", "install-clean", "isntall-clean"],
        "upgrade": ["upgrade", "up", "update"],
        "uninstall": ["uninstall", "un", "unlink", "remove", "rm", "r"],
    },
}

let formatArgs = (rawArgs) => {
    let args = rawArgs;

    if (current !== "npm"
        && pm === "npm"
        && pmInfo[current].add.includes(args[0])
        && args.includes(pmInfo[current].frozen)
    ) {
        return ["ci"]
    }

    if (pmInfo[current].upgrade.includes(args[0])) {
        args[0] = pmInfo[pm].upgrade[0]
    }

    if (pmInfo[current].uninstall.includes(args[0])) {
        args[0] = pmInfo[pm].uninstall[0]
    }

    if (args.length > 1 && pmInfo[current].add.includes(args[0])) {
        args[0] = pmInfo[pm].add[0]
    }

    args = args.flatMap(arg => {
        if (pmInfo[current].global.includes(arg)) {
            if (pm !== "yarn") {
                return pmInfo[pm].global[0]
            }
        } else if (pmInfo[current].dev.includes(arg)) {
            return pmInfo[pm].dev[0]
        } else if (pmInfo[current].frozen.includes(arg)) {
            if (current === "npm") {
                return ["install", pmInfo[pm].frozen[0]]
            }
            return pmInfo[pm].frozen[0]
        }
        return arg;
    })

    return args;
}


if (current !== pm) {
    let formattedArgs = formatArgs(structuredClone(args))

    const answer = await select({
        message: "",
        choices: [
            {
                name: `No, use ${chalk.bold[pmInfo[pm].color](pmInfo[pm].name)}`,
                value: 'useAlternate',
                description: `${chalk.redBright("!")} ${chalk.dim("This will run")} ${pm + " " + formattedArgs.join(" ")}`
            },
            {
                name: `Yes, use ${chalk.bold[pmInfo[current].color](pmInfo[current].name)}`,
                value: 'useDefault',
                description: `${chalk.redBright("!")} ${chalk.dim("This will run")} ${current + " " + args.join(" ")}`
            },
            {
                name: 'Quit',
                value: 'quit',
                description: `${chalk.redBright("!")} ${chalk.dim("This will ") + "cancel the action"}`
            },
        ],
        theme: {
            style: {
                highlight: (text) => chalk.cyan(text),
                help: (text) => chalk.gray(text),
                message: () => chalk.dim("It appears you are using ") + chalk.bold[pmInfo[pm].color](pmInfo[pm].name) + chalk.dim(" as your package manager.\n  Do you wish to continue with ") + chalk.bold[pmInfo[current].color](pmInfo[current].name) + chalk.dim("?"),
            }
        }
    });

    if (answer === "quit") {
        console.log("Action cancelled.")
    } else if (answer == "useDefault") {
        try {
            await execa(current, args, { stdio: 'inherit' })
        } catch (e) { console.log(e.originalMessage) }
    } else if (answer == "useAlternate") {
        try {
            await execa(pm, formattedArgs, { stdio: 'inherit' })
        } catch (e) { console.log(e.originalMessage) }
    }
} else {
    try {
        await execa(current, args, { stdio: 'inherit' })
    } catch (e) { console.log(e.originalMessage) }
}
