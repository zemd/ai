// Runs directly under Node's type stripping, so keep TypeScript syntax erasable.
import { access, readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillsDirectory = fileURLToPath(new URL("../skills", import.meta.url));
const skillNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseFrontmatter = (contents: string): Map<string, string> | undefined => {
  const match = /^---\n(?<frontmatter>[\s\S]*?)\n---(?:\n|$)/.exec(contents);
  const frontmatter = match?.groups?.["frontmatter"];
  if (frontmatter === undefined) {
    return undefined;
  }

  const fields = new Map<string, string>();
  for (const line of frontmatter.split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) {
      return undefined;
    }

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
    fields.set(key, value);
  }

  return fields;
};

const entries = await readdir(skillsDirectory, { withFileTypes: true });
const skillDirectories = entries
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
  .map((entry) => join(skillsDirectory, entry.name))
  .sort();

if (skillDirectories.length === 0) {
  throw new Error("No skills found in skills/.");
}

const errors: string[] = [];

for (const skillDirectory of skillDirectories) {
  const directoryName = basename(skillDirectory);
  const skillPath = join(skillDirectory, "SKILL.md");
  let contents: string;

  try {
    contents = await readFile(skillPath, "utf8");
  } catch {
    errors.push(`${directoryName}: SKILL.md is missing.`);
    continue;
  }

  const fields = parseFrontmatter(contents);
  if (!fields) {
    errors.push(`${directoryName}: frontmatter is missing or malformed.`);
    continue;
  }

  const keys = [...fields.keys()];
  if (keys.length !== 2 || !fields.has("name") || !fields.has("description")) {
    errors.push(`${directoryName}: frontmatter must contain only name and description.`);
  }

  if (fields.get("name") !== directoryName || !skillNamePattern.test(directoryName)) {
    errors.push(`${directoryName}: skill name must match its kebab-case directory.`);
  }

  if (!fields.get("description")?.includes("Use when")) {
    errors.push(`${directoryName}: description must say when to use the skill.`);
  }

  if (contents.split("\n").length > 100) {
    errors.push(`${directoryName}: SKILL.md must stay at or below 100 lines.`);
  }

  if (/\bTODO\b/.test(contents)) {
    errors.push(`${directoryName}: remove TODO placeholders.`);
  }

  try {
    await access(join(skillDirectory, "README.md"));
    errors.push(`${directoryName}: put skill instructions in SKILL.md, not README.md.`);
  } catch {
    // A skill-local README is intentionally absent.
  }

  try {
    const metadata = await readFile(join(skillDirectory, "agents/openai.yaml"), "utf8");
    if (!metadata.includes(`$${directoryName}`)) {
      errors.push(
        `${directoryName}: agents/openai.yaml default_prompt must mention $${directoryName}.`,
      );
    }
  } catch {
    errors.push(`${directoryName}: agents/openai.yaml is missing.`);
  }
}

if (errors.length > 0) {
  throw new Error(`Skill validation failed:\n- ${errors.join("\n- ")}`);
}

console.log(`Checked ${skillDirectories.length} skill${skillDirectories.length === 1 ? "" : "s"}.`);
