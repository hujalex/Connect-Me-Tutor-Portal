import { google } from "googleapis";

async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDIENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return await auth.getClient();
}

export async function readSpreadsheet() {
  const authClient = (await authenticate()) as any;
  const sheets = google.sheets({
    version: "v4",
    auth: authClient,
  }).spreadsheets;

  const spreadsheetId = process.env.SHEET_ID;
  const range = "Questions & Concerns!A1:D5";

  try {
    const response = await sheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    console.log("Data retrieved", rows);
    return rows;
  } catch (error) {
    console.log("Unable to retrive rows", error);
    throw error;
  }
}

interface FormData {
  tutorFirstName?: string;
  tutorLastName?: string;
  studentFirstName?: string;
  studentLastName?: string;
  formContent: string;
  tutorEmail?: string;
  studentEmail?: string;
}
export async function getSheetSize(sheetName: string = "Questions & Concerns") {
  const authClient = (await authenticate()) as any;
  const sheets = google.sheets({ version: "v4", auth: authClient });

  const spreadsheetId = process.env.SHEET_ID;
  const range = `${sheetName}!B:F`; // no cell range, just the sheet name

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    const numRows = rows.length;
    const numCols = rows[0]?.length || 0;

    console.log(`Sheet size: ${numRows} rows, ${numCols} columns`);
    return { numRows, numCols };
  } catch (error) {
    console.error("Error getting sheet size:", error);
    throw error;
  }
}

export async function writeSpreadSheet(formData: FormData) {
  const authClient = (await authenticate()) as any;
  const sheets = google.sheets({
    version: "v4",
    auth: authClient,
  }).spreadsheets;
  const spreadsheetId = process.env.SHEET_ID;

  const currRowSize = (await getSheetSize()).numRows;

  const range = `Questions & Concerns!B${currRowSize + 1}:F${currRowSize + 1}`;
  const valueInputOption = "USER_ENTERED";

  const values = [
    [
      formData.tutorFirstName + " " + formData.tutorLastName,
      formData.studentFirstName + " " + formData.studentLastName,
      formData.tutorEmail,
      formData.studentEmail,
      formData.formContent,
    ],
  ];

  try {
    const response = await sheets.values.update({
      spreadsheetId,
      range,
      valueInputOption,
      requestBody: { values },
    });

    const rows = response.data;
    console.log("Data retrieved", rows);
    return rows;
  } catch (error) {
    console.log("Unable to retrive rows", error);
    throw error;
  }
}
