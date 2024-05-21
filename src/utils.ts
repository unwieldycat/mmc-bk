import { walk } from "@std/fs/walk";
import { BlobWriter, ZipWriter } from "@zip-js/zip-js";
import { relative, resolve } from "@std/path";

export async function createZipFromDir(
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

export function getModifiedDate(filePath: string): Date {
	return Deno.statSync(filePath).mtime || new Date(0);
}

export async function getDirNames(dirPath: string): Promise<Array<string>> {
	const namesArr: Array<string> = [];
	for await (const { isDirectory, name } of Deno.readDir(dirPath)) {
		if (isDirectory) namesArr.push(name);
	}
	return namesArr;
}
