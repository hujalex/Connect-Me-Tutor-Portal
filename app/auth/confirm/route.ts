import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  console.log(redirectTo);

  if (token_hash && type) {
    const supabase = await createRouteHandlerClient({ cookies });

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      console.log("Success");
      return NextResponse.redirect(redirectTo);
    }
  }

  console.log(token_hash);
  console.log(type);

  // return the user to an error page with some instructions
  redirectTo.pathname = "/auth/auth-code-error";
  return NextResponse.redirect(redirectTo);
}

/// confirm http://localhost:3000/auth/confirm?token_hash=pkce_ca1fe23bef3409e34fb65fb30051d7f6b137c789db4a17507a12ec67&type=recovery&next=/auth/forgot/update

// SiteURL http://localhost:3000/auth/confirm?token_hash=pkce_fee5c2b62c4e067928e220729ea7843cb50a946c3b746e76d8740d37&type=recovery&next=/auth/forgot/update

// RedirectTo http://localhost:3000/auth/confirm?token_hash=pkce_4f9f245bf4bbe25191c14f140a78ec8213adec286870822086483b54&type=recovery&next=/auth/forgot/update

///           http://localhost:3000/reset-password/auth/confirm?token_hash=pkce_95a30bb89fbb8ac15409f386d5da4869ae192a70ae1e5362ca9d5afc&type=recovery&next=/auth/forgot/update

//http://localhost:3000/reset-password/auth/confirm?token_hash=pkce_5f32ef4cef77e4e4a657b58c072ebdb154ad187ac9a21b97695a8e9c&type=recovery&next=/auth/forgot/update
//localhost:3000/reset-password/auth/confirm?token_hash=pkce_2e8fc8eb1b75fb39b330fa1620e7e9601a0a079a357db25d9f05c7d7&type=recovery&next=/auth/forgot/update

// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import{ cookies } from "next/headers"
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//     const requestUrl = new URL(request.url);
//     const code = requestUrl.searchParams.get('code')

//     if (code) {
//         const supabase = createRouteHandlerClient({ cookies });
//         await supabase.auth.exchangeCodeForSession(code)
//     }

//     return NextResponse.redirect(`${requestUrl.origin}/reset-password`);
// }
