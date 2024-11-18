"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster, ValueFunction } from "react-hot-toast";
import { useState } from "react";
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
import { setDefaultAutoSelectFamily } from "net";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function LoginForm() {
  const [resetPassword, setResetPassword] = useState<boolean>(false);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const sendResetPassword = async () => {
    try {
      const email = form.getValues("email");
      console.log(email);
      const { data: resetData, error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });

      if (error) {
        throw error;
      }

      // SiteURL http://localhost:3000/auth/confirm?token_hash=pkce_fee5c2b62c4e067928e220729ea7843cb50a946c3b746e76d8740d37&type=recovery&next=/auth/forgot/update

      // RedirectTo http://localhost:3000/auth/confirm?token_hash=pkce_4f9f245bf4bbe25191c14f140a78ec8213adec286870822086483b54&type=recovery&next=/auth/forgot/update

      ///           http://localhost:3000/reset-password/auth/confirm?token_hash=pkce_95a30bb89fbb8ac15409f386d5da4869ae192a70ae1e5362ca9d5afc&type=recovery&next=/auth/forgot/update

      //http://localhost:3000/reset-password/auth/confirm?token_hash=pkce_5f32ef4cef77e4e4a657b58c072ebdb154ad187ac9a21b97695a8e9c&type=recovery&next=/auth/forgot/update
      //localhost:3000/reset-password/auth/confirm?token_hash=pkce_2e8fc8eb1b75fb39b330fa1620e7e9601a0a079a357db25d9f05c7d7&type=recovery&next=/auth/forgot/update

      toast.success("Password reset email sent successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to send password reset email");
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast.success("Logged in successfully");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!resetPassword && (
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 p-0 rounded-md"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your email</FormLabel>
                    <FormControl>
                      <Input placeholder="youremail@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the email associated with your account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter your password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                disabled={isLoading}
                type="submit"
                className="w-full bg-blue-400"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <Toaster />
          </Form>
        </div>
      )}

      {resetPassword && (
        <div>
          <div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 p-0 rounded-md"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter your email</FormLabel>
                      <FormControl>
                        <Input placeholder="youremail@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the email associated with your account.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-blue-400"
                  onClick={sendResetPassword}
                >
                  {isLoading ? "Sending Email..." : "Reset Password"}
                </Button>
              </form>
              <Toaster />
            </Form>
          </div>
        </div>
      )}

      <p
        className="cursor-pointer hover: underline"
        onClick={() => setResetPassword(!resetPassword)}
      >
        {resetPassword ? "Login" : "Reset my Password"}
      </p>
    </>
  );
}
