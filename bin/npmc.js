#!/usr/bin/env node

import detect from "../detectPackageManager.js";
import select from "@inquirer/select";
import chalk from "chalk";
import { execa } from "execa";

let args = process.argv.slice(2);

(async () => {
	let current = "npm";

	if (args[0] === "--pnpm-alias") {
		args.shift();
		current = "pnpm";
	}
	if (args[0] === "--bun-alias") {
		args.shift();
		current = "bun";
	}
	if (args[0] === "--yarn-alias") {
		args.shift();
		current = "yarn";
	}

	const pmInfo = {
		bun: {
			color: "magentaBright",
			name: "Bun",
			add: ["add", "a"],
			install: ["install", "i"],
			global: ["-g", "--global"],
			dev: ["-d", "--development"],
			frozen: ["--no-save"],
			upgrade: ["update"],
			uninstall: ["remove", "r", "rm"],
			run: ["run"],
		},
		pnpm: {
			color: "yellowBright",
			name: "PNPM",
			add: ["add"],
			install: ["install", "i"],
			global: ["-g", "--global"],
			dev: ["-D", "--dev"],
			frozen: ["--frozen-lockfile"],
			upgrade: ["update", "up", "upgrade"],
			uninstall: ["remove", "rm", "uninstall", "un"],
			run: ["run"],
		},
		yarn: {
			color: "blueBright",
			name: "Yarn",
			add: ["add"],
			install: ["install", "i"],
			global: [], // Yarn Berry doesn't have global installation
			dev: ["-D", "--dev"],
			frozen: ["--immutable"],
			upgrade: ["up"],
			uninstall: ["remove"],
			run: ["run"],
		},
		npm: {
			color: "redBright",
			name: "NPM",
			add: [
				"install",
				"i",
				"add",
				"in",
				"inst",
				"insta",
				"instal",
				"isnt",
				"insta",
				"isntal",
				"isntall",
			],
			install: ["install", "i"],
			global: ["-g", "--global"],
			dev: ["-D", "--save-dev", "--dev"],
			frozen: ["ci", "clean-install", "ic", "install-clean", "isntall-clean"],
			upgrade: ["upgrade", "up", "update"],
			uninstall: ["uninstall", "un", "unlink", "remove", "rm", "r"],
			run: ["run", "rum", "urn"],
		},
	};

	let runCommand = async (command, args) => {
		try {
			await execa(command, args, { stdio: "inherit" });
		} catch (e) {
			if (e.originalMessage) {
				console.log(e.originalMessage);
			}
		}
	};

	if (arrayIncludesAny(args, pmInfo[current].global)) {
		runCommand(current, args);
	}

	let shouldRun = false;
	for (let el of [
		...pmInfo[current].add,
		...pmInfo[current].install,
		...pmInfo[current].upgrade,
		...pmInfo[current].uninstall,
		...pmInfo[current].run,
		...pmInfo[current].frozen,
	]) {
		if (args.includes(el)) {
			shouldRun = true;
		}
	}
	if (!shouldRun) {
		runCommand(current, args);
		return;
	}

	const pm = await detect();

	if (current === pm || pm === "none") {
		runCommand(current, args);
		return;
	}

	function arrayIncludesAny(arr1, arr2) {
		for (let element of arr1) {
			if (arr2.includes(element)) {
				return true;
			}
		}
		return false;
	}

	let formatArgs = (rawArgs) => {
		let args = structuredClone(rawArgs);
		if (
			current !== "npm" &&
			pm === "npm" &&
			pmInfo[current].install.includes(args[0]) &&
			arrayIncludesAny(args, pmInfo[current].frozen)
		) {
			return ["ci"];
		}

		if (pmInfo[current].upgrade.includes(args[0])) {
			args[0] = pmInfo[pm].upgrade[0];
		}

		if (pmInfo[current].uninstall.includes(args[0])) {
			args[0] = pmInfo[pm].uninstall[0];
		}

		if (pmInfo[current].install.includes(args[0])) {
			args[0] = pmInfo[pm].install[0];
		}

		if (args.length > 1 && pmInfo[current].add.includes(args[0])) {
			args[0] = pmInfo[pm].add[0];
		}

		args = args.flatMap((arg) => {
			if (pmInfo[current].dev.includes(arg)) {
				return pmInfo[pm].dev[0];
			} else if (pmInfo[current].frozen.includes(arg)) {
				if (current === "npm") {
					return ["install", pmInfo[pm].frozen[0]];
				}
				return pmInfo[pm].frozen[0];
			}
			return arg;
		});

		return args;
	};

	let formattedArgs = formatArgs(args);

	const answer = await select({
		choices: [
			{
				name: `Switch to ${chalk.bold[pmInfo[pm].color](pmInfo[pm].name)}`,
				value: "useAlternate",
				description: `${chalk.redBright("!")} ${chalk.dim.white(
					"This will run"
				)} ${chalk.blue(pm + " " + formattedArgs.join(" "))}`,
			},
			{
				name: `Keep using ${chalk.bold[pmInfo[current].color](
					pmInfo[current].name
				)}`,
				value: "useDefault",
				description: `${chalk.redBright("!")} ${chalk.dim.white(
					"This will run"
				)} ${chalk.blue(current + " " + args.join(" "))}`,
			},
			{
				name: "Quit",
				value: "quit",
				description: `${chalk.redBright("!")} ${
					chalk.dim.white("This will ") + chalk.blue("cancel the action")
				}`,
			},
		],
		theme: {
			style: {
				highlight: (text) => chalk.cyan(text),
				help: () => "",
				message: () =>
					chalk.dim.white("You are using ") +
					chalk.bold[pmInfo[pm].color](pmInfo[pm].name) +
					chalk.dim.white(", but ran a ") +
					chalk.bold[pmInfo[current].color](pmInfo[current].name) +
					chalk.dim.white(" command"),
				answer: (text) => chalk.cyan("\n❯ ") + text,
			},
		},
	});

	if (answer == "useDefault") {
		runCommand(current, args);
	} else if (answer == "useAlternate") {
		runCommand(pm, formattedArgs);
	}
})();
