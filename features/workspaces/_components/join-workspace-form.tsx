"use client";

import DottedSeparator from "@/components/dotted-separator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
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
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="p-7">
        <CardTitle className="text-xl font-bold">Join Workspace</CardTitle>
        <CardDescription>
          You've been invited to join the workspace - <strong>{name}</strong>.
        </CardDescription>
      </CardHeader>
      <div className="">
        <DottedSeparator />
      </div>
      <CardContent className="p-7">
        <div className="flex flex-col lg:flex-row gap-2 items-center justify-between">
          <Button
            className="w-full lg:w-fit"
            variant="secondary"
            type="button"
            asChild
          >
            <Link href="/">Cancel</Link>
          </Button>
          <Button className="w-full lg:w-fit" size="lg" type="button">
            Join Workspace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
export default JoinWorkspaceForm;
