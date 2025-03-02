import { join } from "path";
import { writeFile } from "fs/promises";

export async function uploadImageToLocalStorage(image: File) {
  const uploadDir = "uploaded_files";
  const buffer = Buffer.from(await image.arrayBuffer());
  const uploadDirPath = join(process.cwd(), "public", uploadDir);
  await writeFile(`${uploadDirPath}/${image.name}`, buffer);
  return `${uploadDir}/${image.name}`;
}
