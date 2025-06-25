"use client";
import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormItem,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
//import { FcGoogle } from "react-icons/fc";
//import { FaGithub } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useSignUp } from "../api/use-sign-up";
import { useSearchParam } from "react-use";
import { notFound, useSearchParams } from "next/navigation";

const SignUpCard = () => {
  const inviteCode = useSearchParams().get("inviteCode");
  const { mutate: registerNewUser } = useSignUp();
  const formSchema = z
    .object({
      password: z.string().min(8).max(256),
      confirmPassword: z.string().min(8).max(256),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    try {
      //console.log("data", data);
      if (!inviteCode) {
        notFound();
      }
      registerNewUser({ json: { password: data.password, inviteCode } });
    } catch (error) {
      console.error;
      console.error(error);
    }
  };

  return (
    <Card className="w-full h-full md:w-[600px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">Welcome to Codeflow Pro</CardTitle>
      </CardHeader>
      <div className="px-7">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <p className="pb-7">
          Please enter a password to complete your new account signup.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="password" placeholder="password" />
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
                  <FormControl>
                    <Input {...field} type="password" placeholder="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button size="lg" className="w-full" type="submit">
              Log In
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeparator />
      </div>
      {/* <CardContent className="p-7 flex flex-col gap-y-4">
        <Button variant="secondary" size="lg" className="w-full">
          <FcGoogle className="mr-2" />
          Login with Google
        </Button>
        <Button variant="secondary" size="lg" className="w-full">
          <FaGithub className="mr-2" />
          Login with Github
        </Button>
      </CardContent> */}
    </Card>
  );
};
export default SignUpCard;
