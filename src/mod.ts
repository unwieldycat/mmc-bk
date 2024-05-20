import { relative, resolve } from "@std/path";
import { walk } from "@std/fs/walk";
import { BlobWriter, ZipWriter } from "@zip-js/zip-js";

// =============================== Functions =============================== //

async function createZipFromDir(
	dirPath: string,
	outPath: string,
	fileName: string,
) {
	// Create zip writers
	const zipFileWriter = new BlobWriter("application/zip");
	const zipWriter = new ZipWriter(zipFileWriter);

	for await (const dirEntry of walk(dirPath)) {
		if (!dirEntry.isFile) continue;

		const filePath = relative(dirPath, dirEntry.path);
		Deno.open(dirEntry.path, { read: true, write: false })
			.then((file) => {
				zipWriter.add(filePath, file.readable);
			});
	}

	// Close writer and save to zip file
	zipWriter.close().then((zipBlob) => {
		Deno.create(
			resolve(outPath, fileName + ".zip"),
		).then((file) => {
			zipBlob.stream().pipeTo(file.writable);
		});
	});
}

function getModifiedDate(filePath: string): Date {
	return Deno.statSync(filePath).mtime || new Date(0);
}

// ================================== Main ================================== //

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

	// TODO: Check date against backups log
	// TODO: If not modified, return

	console.log(`Backing up world ${name}`);
	createZipFromDir(worldPath, backupPath, saveString);
}

// TODO: Purge old backups
