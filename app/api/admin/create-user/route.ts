import { getSupabase } from "@/lib/supabase-server/serverClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const userId = await createUser(email, password);
    return NextResponse.json(
      { success: true, userId: userId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error,
      },
      { status: 500 }
    );
  }
}

const createUser = async (
  email: string,
  password: string
): Promise<string | null> => {
  try {
    // Call signUp to create a new user
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
    });

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    // Return the user ID
    return data?.user?.id || null; // Use optional chaining to safely access id
  } catch (error) {
    console.error("Error creating user:", error);
    return null; // Return null if there was an error
  }
};
