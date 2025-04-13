import { readSpreadsheet, writeSpreadSheet } from "@/lib/google-sheet";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface FormData {
  tutorFirstName?: string;
  tutorLastName?: string;
  studentFirstName?: string;
  studentLastName?: string;
  formContent: string;
  tutorEmail?: string;
  studentEmail?: string;
}

interface ResponseData {
  success: boolean;
  data?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("GET");
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest, response: NextResponse) {
  try {
    console.log("POSTING");
    const formData = await request.json();
    console.log("Form Data", formData);

    const data = await writeSpreadSheet(formData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({
      success: false,
      error: "Unable to update question or concern",
    });
  }
}
