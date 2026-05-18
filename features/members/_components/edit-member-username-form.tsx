"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PencilIcon } from "lucide-react";

import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateMemberUsername } from "../api/use-update-member-username";

const schema = z.object({
  name: z.string().min(1, "Username is required"),
});

interface EditMemberUsernameFormProps {
  memberId: string;
  workspaceId: string;
  currentName: string | null;
}

const EditMemberUsernameForm = ({
  memberId,
  workspaceId,
  currentName,
}: EditMemberUsernameFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate, isPending } = useUpdateMemberUsername();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName || "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    mutate(
      { memberId, name: values.name, workspaceId },
      {
        onSuccess: () => {
          toast.success("Username updated");
          setIsEditing(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update username");
        },
      },
    );
  };

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="gap-x-1.5"
      >
        <PencilIcon className="size-3.5" />
        Edit Username
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-xl p-4 bg-card">
      <p className="text-sm font-semibold text-foreground mb-3">Edit Username</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter username"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-x-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => {
                form.reset();
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditMemberUsernameForm;
