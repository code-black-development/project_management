"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

//import { useJoinWorkspace } from "../api/use-join-workspace";
import { useRouter } from "next/navigation";

interface JoinWorkspaceFormProps {
  initialValues: {
    name: string;
    workspaceId: string;
    inviteCode: string;
  };
}

const JoinWorkspaceForm = ({ initialValues }: JoinWorkspaceFormProps) => {
  //const { mutate } = useJoinWorkspace();
  const { inviteCode, name, workspaceId } = initialValues;
  const router = useRouter();

  const onSubmit = () => {
    /* mutate(
      {
        param: { workspaceId },
        json: { code: inviteCode },
      },
      {
        onSuccess: ({ data }) => {
          router.push(`/workspaces/${data.workspaceId}`);
        },
      }
    ); */
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-base font-semibold text-foreground">
          Join Workspace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You've been invited to join the workspace - <strong>{name}</strong>.
        </p>
      </div>
      <div className="px-6 py-5">
        <div className="flex flex-col lg:flex-row gap-2 items-center justify-between">
          <Button
            className="w-full lg:w-fit"
            variant="secondary"
            type="button"
            asChild
          >
            <Link href="/">Cancel</Link>
          </Button>
          <Button className="w-full lg:w-fit" type="button">
            Join Workspace
          </Button>
        </div>
      </div>
    </div>
  );
};
export default JoinWorkspaceForm;
