"use client";

import toast, { Toaster } from "react-hot-toast"; // Removed unused ValueFunction
import Logo from "@/components/ui/logo";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
// import Link from "next/link"; // Link was not used
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useState, useEffect } from "react"; // Added useEffect
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { setDefaultAutoSelectFamily } from "net"; // Removed unused import

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

export default function AuthError() {
  // const [resetPassword, setResetPassword] = useState<boolean>(false); // This state was not used
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const errorDescription = searchParams.get("error_description");
    const message = searchParams.get("message");
    if (errorDescription) {
      setErrorMessage(errorDescription);
    } else if (message) {
      setErrorMessage(message);
    }
  }, [searchParams]);

  const sendResetPassword = async () => {
    setIsLoading(true);
    try {
      const email = form.getValues("email");
      // console.log(email);

      const { data: resetData, error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`, // It's good practice to redirect to a callback route
        });
      if (error) {
        throw error;
      }
      // Supabase resetPasswordForEmail returns { data: {}, error: null } on success, data is an empty object.
      // So checking !resetData might not be the correct way if an empty object is valid.
      // The absence of an error is usually the indicator of success.
      toast.success(
        "Password reset email sent successfully. Please check your inbox."
      );
    } catch (error: any) {
      console.error("Unable to reset password:", error);
      toast.error(
        `Unable to send reset password link: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  return (
    <>
      <Toaster position="top-center" />{" "}
      {/* Ensure Toaster is rendered once and configured */}
      <section className="flex flex-row ">
        <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
          <Logo />
        </div>
      </section>
      <section className="flex flex-row justify-center items-center min-h-screen px-4">
        <section className="w-full flex flex-col items-center ">
          <div className="container h-full mx-auto max-w-lg p-6 sm:p-10 flex flex-col items-center justify-center">
            <div className="p-6 sm:p-8 flex flex-col items-center justify-center gap-4 border border-gray-300 rounded-xl shadow-lg w-full">
              <div className="flex flex-col gap-3 text-center">
                <h1 className="text-xl sm:text-2xl font-bold">
                  Authentication Error
                </h1>
                {errorMessage ? (
                  <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">
                    {decodeURIComponent(errorMessage)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Your authentication link may have expired or is invalid.
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  You can request a new password reset link below.
                </p>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(sendResetPassword)} // Directly call sendResetPassword
                  className="space-y-6 w-full" // Adjusted spacing
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter your account email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="youremail@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          We will send a password reset link to this email.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white" // Adjusted button color
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
                {/* <Toaster /> */} {/* Removed redundant Toaster */}
              </Form>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
