"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormItem,
  FormField,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { z } from "zod";
import { useForm } from "react-hook-form";

const SignInCard = () => {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const formSchema = z.object({
    email: z.string().trim().min(1, "required").email(),
    password: z.string().min(8).max(256),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsPending(true);

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false, // Don't redirect automatically
      });

      if (result?.error) {
        toast.error(
          "The credentials provided were not correct. Please try again.",
        );
      } else if (result?.ok) {
        toast.success("Successfully signed in!");
        router.push("/"); // Redirect on success
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Sign-in exception:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full md:w-[487px] overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:shadow-none">
      <div className="border-b border-border px-6 py-5 text-center">
        <h1 className="text-base font-semibold text-foreground">Welcome</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue to your workspace.
        </p>
      </div>
      <div className="px-6 py-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Signing in..." : "Log in"}
            </Button>
            <div className="text-center">
              <Link
                href={`/forgot-password${form.getValues("email") ? `?email=${encodeURIComponent(form.getValues("email"))}` : ""}`}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                Forgotten password?
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
export default SignInCard;
