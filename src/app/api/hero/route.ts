import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const metaPath = path.join(process.cwd(), "seed-data", "meta.json");
    const raw = await fs.readFile(metaPath, "utf-8");
    const meta = JSON.parse(raw);
    return NextResponse.json({ hero: meta.hero || [] });
  } catch {
    return NextResponse.json({ hero: [] });
  }
}
