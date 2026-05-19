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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useSignUp } from "../api/use-sign-up";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface SignUpCardProps {
  inviteCode?: string;
  workspaceName?: string;
}

const SignUpCard = ({ inviteCode, workspaceName }: SignUpCardProps) => {
  const { mutate: registerNewUser, isPending } = useSignUp();
  const router = useRouter();

  const formSchema = z
    .object({
      email: z.string().trim().min(1, "Required").email("Invalid email address"),
      name: z.string().trim().optional(),
      password: z.string().min(8, "Password must be at least 8 characters").max(256),
      confirmPassword: z.string().min(8).max(256),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    registerNewUser(
      {
        json: {
          email: data.email,
          password: data.password,
          name: data.name || undefined,
          inviteCode: inviteCode || undefined,
        },
      },
      {
        onSuccess: (response) => {
          toast.success("Account created! Please check your email to verify your address.");
          const email = response.data.email;
          router.push(`/verify-email?email=${encodeURIComponent(email ?? "")}`);
        },
        onError: (error) => {
          console.error("Registration failed:", error);
          toast.error(
            error.message === "Failed to register user"
              ? "Failed to create account. The email may already be in use."
              : "Failed to create account. Please try again."
          );
        },
      }
    );
  };

  const title = workspaceName
    ? `Join ${workspaceName}`
    : "Create your account";

  const subtitle = workspaceName
    ? `You've been invited to join ${workspaceName}. Create an account to get started.`
    : "Sign up for fasta.work and start managing your projects.";

  return (
    <div className="w-full md:w-[487px] overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:shadow-none">
      <div className="border-b border-border px-6 py-5 text-center">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
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
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="text" placeholder="Your name" />
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
            <FormField
              name="confirmPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Confirm password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-foreground underline hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignUpCard;
