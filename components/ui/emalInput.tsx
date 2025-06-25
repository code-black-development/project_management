"use client";

import { useState } from "react";
import {
  Controller,
  Control,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Optional utility for styling

type EmailInputProps = {
  control: Control<{ invites: string[] }>;
  setValue: UseFormSetValue<{ invites: string[] }>;
  errors: FieldErrors<{ invites: string[] }>;
};

export function EmailInput({ control, setValue, errors }: EmailInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const trimmedEmail = inputValue.trim().replace(/,$/, ""); // Remove trailing comma

      if (trimmedEmail) {
        const currentEmails = control._getWatch("invites") || [];

        if (!currentEmails.includes(trimmedEmail)) {
          setValue("invites", [...currentEmails, trimmedEmail]);
          setInputValue("");
        }
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const filteredEmails = control
      ._getWatch("invites")
      .filter((email: string) => email !== emailToRemove);
    setValue("invites", filteredEmails);
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <Controller
        name="invites"
        control={control}
        render={({ field }) => (
          <div
            className={cn(
              "border rounded-lg p-2 flex flex-wrap items-center gap-2 min-h-[40px]",
              {
                "border-red-500": errors.invites,
              }
            )}
          >
            {field.value?.map((email: string) => (
              <Badge
                key={email}
                variant="secondary"
                className="flex items-center space-x-2 text-[14px]"
              >
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="ml-1"
                >
                  <X className="w-6 h-6 font-bold p-1 bg-white rounded-full text-red-500 hover:text-red-700" />
                </button>
              </Badge>
            ))}
            <Input
              type="email"
              placeholder="Enter email..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-none focus:ring-0 focus:outline-none"
            />
          </div>
        )}
      />
      {errors.invites && (
        <p className="text-red-500 text-sm">{errors.invites.message}</p>
      )}
    </div>
  );
}
