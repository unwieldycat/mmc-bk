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

// ================================== Main ================================== //

/*
// Get Environment Variables
const instanceName = Deno.env.get("INST_NAME");
const minecraftPath = Deno.env.get("INST_MC_DIR");
const backupPath = Deno.env.get("MMCBK_DIR");
const purgeCount = Number(Deno.env.get("MMCBK_PURGE") || "0");
*/
