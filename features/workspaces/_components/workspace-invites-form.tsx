"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { EmailInput } from "@/components/ui/emalInput";
import { useWorkspaceId } from "../hooks/use-workspace-id";
import { useCreateWorkspaceInvites } from "../api/use-create-workspace-invites";
import { createWorkspaceInvitesSchema } from "../schemas";

const WorkspaceInviteForm = () => {
  const workspaceId = useWorkspaceId();
  const formSchema = createWorkspaceInvitesSchema;

  const { mutate } = useCreateWorkspaceInvites();

  const router = useRouter();

  const {
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { invites: [] },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate({ json: { ...values }, param: { workspaceId } });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
      <div className="w-full rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-base font-semibold text-foreground">
            Invite Members
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite others to collaborate on your projects in this workspace.
            <br /> (Invites will expire after 7 days).
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-x-2">
              <EmailInput
                control={control}
                setValue={setValue}
                errors={errors}
              />
            </div>
            <Button
              className="mt-6 w-fit ml-auto"
              size="sm"
              variant="primary"
              type="submit"
              //disabled={isPending}
            >
              Send Invites
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default WorkspaceInviteForm;
