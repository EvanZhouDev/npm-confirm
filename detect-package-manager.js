import { promises as fs } from "fs";
import { resolve } from "path";

/**
 * Check if a path exists
 */
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const cache = new Map();

function getTypeofLockFile(cwd = ".") {
  const key = `lockfile_${cwd}`;
  if (cache.has(key)) {
    return Promise.resolve(cache.get(key));
  }

  return Promise.all([
    pathExists(resolve(cwd, "yarn.lock")),
    pathExists(resolve(cwd, "package-lock.json")),
    pathExists(resolve(cwd, "pnpm-lock.yaml")),
    pathExists(resolve(cwd, "bun.lockb")),
  ]).then(([isYarn, isNpm, isPnpm, isBun]) => {
    let value = null;

    if (isYarn) {
      value = "yarn";
    } else if (isPnpm) {
      value = "pnpm";
    } else if (isBun) {
      value = "bun";
    } else if (isNpm) {
      value = "npm";
    }

    cache.set(key, value);
    return value;
  });
}

const detect = async ({
  cwd
} = {}) => {
  const type = await getTypeofLockFile(cwd);
  if (type) {
    return type;
  }
  return "none";
};

export { detect };
