import SignUpCard from "@/features/auth/components/sign-up-card";
import { getWorkspaceInvite } from "@/lib/dbService/workspace-invites";

interface SignUpProps {
  searchParams: Promise<{
    inviteCode?: string;
  }>;
}

const SignUp = async ({ searchParams }: SignUpProps) => {
  const { inviteCode } = await searchParams;

  let workspaceName: string | undefined;

  if (inviteCode) {
    const invite = await getWorkspaceInvite(inviteCode);
    if (invite) {
      workspaceName = invite.workspace.name;
    }
    // If invite code is invalid we still show the form, just without workspace name
  }

  return <SignUpCard inviteCode={inviteCode} workspaceName={workspaceName} />;
};

export default SignUp;
