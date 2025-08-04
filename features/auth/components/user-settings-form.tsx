"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormMessage,
  FormControl,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import DottedSeparator from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useUpdateUserProfile } from "../api/use-update-user-profile";
import { updateUserProfileSchema } from "../schema";
import { usePresignedUrl } from "@/hooks/use-presigned-url";

interface UserSettingsFormProps {
  onCancel?: () => void;
}

const UserSettingsForm = ({ onCancel }: UserSettingsFormProps) => {
  const { data: session, update } = useSession();
  const { mutate: updateProfile, isPending } = useUpdateUserProfile();
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof updateUserProfileSchema>>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      image: session?.user?.image || undefined,
    },
  });

  // Debug log to see what's in the session
  const { isDirty } = form.formState;

  const onSubmit = (values: z.infer<typeof updateUserProfileSchema>) => {
    if (!session?.user?.id) {
      toast.error("User session not found");
      return;
    }

    const formValues = {
      ...values,
      image: values.image instanceof File || values.image ? values.image : "",
    };

    updateProfile(
      {
        form: formValues,
      },
      {
        onSuccess: async (data) => {
          toast.success("Profile updated successfully");

          // Update the session with new data - this will trigger the jwt callback
          await update({ 
            name: values.name,
            image: data.data.image 
          });

          // Reset form to clear dirty state
          form.reset({ 
            name: values.name,
            image: data.data.image || undefined 
          });

          // Close the modal
          onCancel?.();
        },
        onError: () => {
          toast.error("Failed to update profile");
        },
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file, { shouldDirty: true });
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  if (!session?.user) {
    return (
      <Card className="w-full h-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="text-center">
            <p className="text-muted-foreground">Loading user information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">User Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name and Email Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={session.user.email || ""}
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email address cannot be changed
                </p>
              </div>
            </div>

            <DottedSeparator className="my-6" />

            {/* Profile Image Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Profile Photo</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  JPG, PNG, or JPEG. Max 1mb.
                </p>
              </div>
              
              <FormField
                name="image"
                control={form.control}
                render={({ field }) => {
                  const { presignedUrl } = usePresignedUrl(
                    typeof field.value === "string" && field.value ? field.value : null
                  );
                  
                  return (
                    <div className="flex items-center gap-x-5">
                      {field.value ? (
                        <div className="size-16 relative rounded-full overflow-hidden">
                          <Image
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : presignedUrl || "/placeholder-avatar.png"
                            }
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <Avatar className="size-16">
                          <AvatarFallback>
                            <ImageIcon className="size-8 text-neutral-400" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <input
                          className="hidden"
                          type="file"
                          accept=".jpg, .png, .jpeg"
                          ref={inputRef}
                          disabled={isPending}
                          onChange={handleImageChange}
                        />
                        {field.value ? (
                          <Button
                            type="button"
                            disabled={isPending}
                            variant="destructive"
                            size="xs"
                            className="w-fit"
                            onClick={() => {
                              field.onChange("");
                              if (inputRef.current) {
                                inputRef.current.value = "";
                              }
                            }}
                          >
                            Remove Photo
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            disabled={isPending}
                            variant="tertiary"
                            size="xs"
                            className="w-fit"
                            onClick={() => inputRef.current?.click()}
                          >
                            Upload Photo
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            <DottedSeparator className="py-7" />

            <div className="flex justify-between items-center">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                disabled={isPending}
                onClick={handleCancel}
                className={cn(!onCancel && "invisible")}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending || !isDirty}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UserSettingsForm;
