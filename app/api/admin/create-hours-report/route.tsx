// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import HoursPDFDocument from "@/components/admin/HoursReport";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const pdfBuffer = await renderToBuffer(<HoursPDFDocument data={data} />);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { message: "Error generating PDF" },
      { status: 500 }
    );
  }
}
