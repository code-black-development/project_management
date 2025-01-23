import {
  createWorkspace,
  getWorkspaceByUserId,
} from "@/lib/dbService/workspaces";
import { getUserId } from "@/lib/user";
import { NextResponse } from "next/server";
import { join } from "path";
import { writeFile } from "fs/promises";

export const POST = async (req: Request) => {
  console.log("route running");
  try {
    const uploadDir = "uploaded_files";
    const formData = await req.formData();

    const image = (formData.get("image") as File) || null;
    const buffer = Buffer.from(await image.arrayBuffer());
    const uploadDirPath = join(process.cwd(), "public", uploadDir);
    await writeFile(`${uploadDirPath}/${image.name}`, buffer);
    const fileUrl = `${uploadDir}/${image.name}`;
    console.log("fileUrl", fileUrl);

    const name = formData.get("name") as string;
    const userId = await getUserId();

    const workspace = await createWorkspace(name, fileUrl, userId!);
    return NextResponse.json(workspace);
  } catch (e) {
    return new NextResponse("Internal Error", { status: 500 });
  }
};

export const GET = async () => {
  try {
    const userId = await getUserId();
    const workspaces = await getWorkspaceByUserId("userId");
    return NextResponse.json(workspaces);
  } catch (e) {
    return new NextResponse("Internal Error", { status: 500 });
  }
};
