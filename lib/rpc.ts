import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>("https://project.codeblack.digital"); //process.env.NEXT_PUBLIC_API_URL!);
