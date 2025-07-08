"use client";

import SignInCard from "@/features/auth/components/sign-in-card";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const SignIn = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      switch (error) {
        case "CredentialsSignin":
          toast.error(
            "The credentials provided were not correct. Please try again."
          );
          break;
        case "Configuration":
          toast.error(
            "There is a problem with the server configuration. Please try again later."
          );
          break;
        default:
          toast.error("An error occurred during sign in. Please try again.");
          break;
      }
    }
  }, [error]);

  return <SignInCard />;
};

export default SignIn;
