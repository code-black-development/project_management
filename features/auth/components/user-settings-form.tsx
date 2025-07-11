"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import MemberAvatar from "@/features/members/_components/member-avatar";
import { useUpdateUserProfile } from "../api/use-update-user-profile";

const userSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

interface UserSettingsFormProps {
  onCancel?: () => void;
}

const UserSettingsForm = ({ onCancel }: UserSettingsFormProps) => {
  const { data: session, update } = useSession();
  const { mutate: updateProfile, isPending } = useUpdateUserProfile();

  const form = useForm<z.infer<typeof userSettingsSchema>>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: session?.user?.name || "",
    },
  });

  const { isDirty } = form.formState;

  const onSubmit = (values: z.infer<typeof userSettingsSchema>) => {
    if (!session?.user?.id) {
      toast.error("User session not found");
      return;
    }

    updateProfile(
      {
        json: values,
      },
      {
        onSuccess: async () => {
          toast.success("Profile updated successfully");

          // Update the session with new data - this will trigger the jwt callback
          await update({ name: values.name });

          // Reset form to clear dirty state
          form.reset({ name: values.name });

          // Close the modal
          onCancel?.();
        },
        onError: () => {
          toast.error("Failed to update profile");
        },
      }
    );
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
        <div className="flex items-center gap-x-4 mb-6">
          <MemberAvatar
            name={form.watch("name") || session.user.email || "U"}
            className="size-16"
          />
          <div>
            <h3 className="text-lg font-medium">
              {form.watch("name") || "Unnamed User"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </div>

        <DottedSeparator className="mb-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
