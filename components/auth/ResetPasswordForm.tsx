// "use client";

// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import { setDefaultAutoSelectFamily } from "net";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useState, useEffect } from "react";
// import { string } from "zod";
// import { Button } from "@/components/ui/button";

// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm } from "react-hook-form";
// import * as z from "zod";
// import Link from "next/link";
// import toast, { Toaster, ValueFunction } from "react-hot-toast";

// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Router } from "lucide-react";

// const formSchema = z
//   .object({
//     password: z.string().min(6, {
//       message: "Please enter a valid email address.",
//     }),
//     confirmPassword: z.string().min(6, {
//       message: "Password must be at least 6 characters.",
//     }),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords do not match",
//     path: ["confirmPassword"],
//   });

// export default function ResetPasswordPage() {
//   const supabase = createClientComponentClient();

//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get("code");
//   console.log(token);

//   const [data, setData] = useState<{
//     password: string;
//     confirmPassword: string;
//   }>({
//     password: "",
//     confirmPassword: "",
//   });

//   // const [ success, setSuccess ] = useState<boolean>(false)

//   // const router = useRouter();

//   const [showPassword, setShowPassword] = useState<boolean>(false);

//   useEffect(() => {
//     const exchangeCodeForSession = async () => {
//       if (token) {
//         const { data, error } = await supabase.auth.exchangeCodeForSession(
//           token
//         );
//         if (error) {
//           console.error("Error exchanging code for session:", error);
//           toast.error("Error exchanging code for session.");
//           return;
//         }
//         console.log("Session created:", data);
//       }
//     };
//     exchangeCodeForSession();
//   }, [supabase, token]);

//   const confirmPasswords = async () => {
//     const { password, confirmPassword } = data;
//     if (password !== confirmPassword) {
//       toast.error("Passwords do not match");
//       return alert("Passwords do not match");
//     }

//     const { data: resetData, error } = await supabase.auth.updateUser({
//       password: data.password,
//     });

//     if (resetData.user) {
//       const { data: sessionData, error: sessionError } =
//         await supabase.auth.getSession();
//       if (sessionError) {
//         console.log("Error fetching session:", sessionError);
//       } else {
//         console.log("Session after password reset:", sessionData);
//       }
//       toast.success("Yay");
//       router.push("/");
//     }

//     if (error) console.log(error);
//   };

//   const handleChange = (e: any) => {
//     const { name, value } = e.target;
//     setData((prev: any) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   //   const form = useForm<z.infer<typeof formSchema>>({
//   //     resolver: zodResolver(formSchema),
//   //     defaultValues: {
//   //       password: "",
//   //       confirmPassword: "",
//   //     },
//   //   });

//   //   const onSubmit = async (values: z.infer<typeof formSchema>) => {
//   //     try {
//   //       toast.success("Submitted");

//   //       const { data, error } = await supabase.auth.updateUser({
//   //         password: values.password,
//   //       });

//   //       if (error) {
//   //         throw error;
//   //       }

//   //       toast.success("Submitted");

//   //       if (data.user) {
//   //         toast.success("Password set successfully");
//   //         router.push("/");
//   //       } else {
//   //         toast.error("Something went wrong. Please try again.");
//   //       }
//   //     } catch (error) {
//   //       if (error instanceof Error) {
//   //         toast.error(error.message);
//   //       } else {
//   //         toast.error("An unknown error occurred");
//   //       }
//   //     }
//   //   };

//   return (
//     <>
//       <Toaster />

//       {/* <div className="container mx-auto w-[400px] grid gap-4">
//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className="space-y-8 p-0 rounded-md"
//           >
//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Enter your password</FormLabel>
//                   <FormControl>
//                     <Input type="password" placeholder="********" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <FormField
//               control={form.control}
//               name="confirmPassword"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Confirm your password</FormLabel>
//                   <FormControl>
//                     <Input type="password" placeholder="********" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//             <Button type="submit" className="w-full bg-blue-400">
//               Set Password
//             </Button>
//           </form>
//         </Form>
//       </div> */}

//       <div className="container mx-auto w-[400px] grid gap-4">
//         <div className="grid gap-4">
//           <label className="text-sm font-medium">Enter your new password</label>
//           <input
//             type={showPassword ? "text" : "password"}
//             name="password"
//             value={data?.password}
//             onChange={handleChange}
//             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//           />
//         </div>
//         <div className="grid gap-4">
//           <label className="text-sm font-medium">
//             Confirm your new password
//           </label>
//           <input
//             type={showPassword ? "text" : "password"}
//             name="confirmPassword"
//             value={data?.confirmPassword}
//             onChange={handleChange}
//             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//           />
//         </div>
//         <div
//           className="cursor-pointer hover:underline"
//           onClick={() => setShowPassword(!showPassword)}
//         >
//           Show passwords
//         </div>
//         <Button
//           type="submit"
//           className="w-full bg-blue-400"
//           onClick={confirmPasswords}
//         >
//           Reset Password
//         </Button>
//       </div>
//     </>
//   );
// }
