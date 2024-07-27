import fs from "fs";

async function pathExists(p) {
	try {
		await fs.promises.access(p);
		return true;
	} catch {
		return false;
	}
}

export default async function detect() {
	if (await pathExists("yarn.lock")) {
		return "yarn";
	} else if (await pathExists("package-lock.json")) {
		return "npm";
	} else if (await pathExists("pnpm-lock.yaml")) {
		return "pnpm";
	} else if (await pathExists("bun.lockb")) {
		return "bun";
	}
	return "none";
}
