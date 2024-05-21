import { resolve } from "@std/path";
import { createZipFromDir, getDirNames, getModifiedDate } from "./utils.ts";

// Get Environment Variables
const instanceName = Deno.env.get("INST_NAME");
const minecraftPath = Deno.env.get("INST_MC_DIR");
const backupPath = Deno.env.get("MMCBK_DIR");
const purgeCount = Number(Deno.env.get("MMCBK_PURGE") || "0");

if (!backupPath) {
	console.error("Unable to backup: MMCBK_DIR not defined!");
	Deno.exit(1);
}

if (!instanceName || !minecraftPath) {
	console.error(
		"Unable to backup: Missing MultiMC environment variables.",
	);
	Deno.exit(1);
}

console.log(`Backing up worlds from instance ${instanceName} to ${backupPath}`);

const savesPath = resolve(minecraftPath, "saves");

for await (const { isDirectory, name } of Deno.readDir(savesPath)) {
	if (!isDirectory) continue;

	const worldPath = resolve(savesPath, name);
	const lastPlayedDate = getModifiedDate(resolve(worldPath, "level.dat"));
	const saveString = `${name}_${lastPlayedDate.toISOString()}`;

	const prevSaveNames = await getDirNames(backupPath);
	if (prevSaveNames.includes(saveString)) {
		console.log(`Backup already exists for world ${name}`);
		continue;
	}

	console.log(`Backing up world ${name}`);
	createZipFromDir(worldPath, backupPath, saveString);
}

// TODO: Purge old backups
