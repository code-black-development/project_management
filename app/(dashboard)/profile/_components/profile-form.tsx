"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { z } from "zod";
import {
  Form,
  FormField,
  FormMessage,
  FormControl,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useUpdateUserProfile } from "@/features/auth/api/use-update-user-profile";
import { updateUserProfileSchema } from "@/features/auth/schema";
import { usePresignedUrl } from "@/hooks/use-presigned-url";

const ProfileForm = () => {
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

  const { isDirty } = form.formState;

  const onSubmit = (values: z.infer<typeof updateUserProfileSchema>) => {
    if (!session?.user?.id) {
      toast.error("User session not found");
      return;
    }
    updateProfile(
      { form: { ...values, image: values.image instanceof File || values.image ? values.image : "" } },
      {
        onSuccess: async (data) => {
          toast.success("Profile updated");
          await update({ name: values.name, image: data.data.image });
          form.reset({ name: values.name, image: data.data.image || undefined });
        },
        onError: () => toast.error("Failed to update profile"),
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) form.setValue("image", file, { shouldDirty: true });
  };

  if (!session?.user) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
        Profile
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-5">
          <div className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your name" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={session.user.email || ""}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Profile photo
            </p>
            <FormField
              name="image"
              control={form.control}
              render={({ field }) => {
                const { presignedUrl } = usePresignedUrl(
                  typeof field.value === "string" && field.value ? field.value : null
                );
                return (
                  <div className="flex items-center gap-x-4">
                    {field.value ? (
                      <div className="size-12 relative rounded-full overflow-hidden shrink-0">
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
                      <Avatar className="size-12 shrink-0">
                        <AvatarFallback>
                          <ImageIcon className="size-5 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <input
                      className="hidden"
                      type="file"
                      accept=".jpg,.png,.jpeg"
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
                        onClick={() => {
                          field.onChange("");
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                      >
                        Remove photo
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={isPending}
                        variant="muted"
                        size="xs"
                        onClick={() => inputRef.current?.click()}
                      >
                        Upload photo
                      </Button>
                    )}
                  </div>
                );
              }}
            />
          </div>

          <div className="border-t border-border pt-4 flex justify-end">
            <Button type="submit" size="sm" disabled={isPending || !isDirty}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfileForm;
