import { createSubjectEmbeddings } from "@/lib/pairing/embeddings";
import { NextRequest, NextResponse } from "next/server";

//used to create subject embeddings
export async function POST(request: NextRequest) {
  console.log("hit ");
  try {
    const { subjects } = await request.json();
    if (!subjects)
      return NextResponse.json(
        { error: "must provide subjects" },
        { status: 403 }
      );
    const embed = await createSubjectEmbeddings(subjects as string[]);

    return NextResponse.json({ embed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
