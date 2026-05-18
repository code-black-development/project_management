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
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { z } from "zod";
import { useForm } from "react-hook-form";

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
});

export const ForgotPasswordCard = () => {
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Pre-fill email from URL parameter
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [searchParams, form]);

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    try {
      setIsPending(true);

      const response = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("Reset link sent successfully!");
      } else {
        toast.error(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full md:w-[487px] overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:shadow-none">
        <div className="border-b border-border px-6 py-5 text-center">
          <h1 className="text-base font-semibold text-foreground">
            Check Your Email
          </h1>
        </div>
        <div className="px-6 py-5">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you, if your email is in the system we will email you a
              reset link. Please check your email account.
            </p>
            <div className="pt-4">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[487px] overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:shadow-none">
      <div className="border-b border-border px-6 py-5 text-center">
        <h1 className="text-base font-semibold text-foreground">
          Forgot Password?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email address and we'll send you a reset link
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
                      placeholder="Enter your email address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send Reset Link"}
            </Button>
            <div className="text-center">
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                <ArrowLeft className="w-3 h-3 inline mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
