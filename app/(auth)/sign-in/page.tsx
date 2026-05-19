"use client";

import SignInCard from "@/features/auth/components/sign-in-card";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const SignIn = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const verified = searchParams.get("verified");

  useEffect(() => {
    if (verified === "1") {
      toast.success("Email verified — please sign in");
    }
  }, [verified]);

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
        case "missing-token":
        case "invalid-token":
          toast.error("The verification link is invalid. Please request a new one.");
          break;
        case "expired-token":
          toast.error("The verification link has expired. Please sign up again.");
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
