import SignUpCard from "@/features/auth/components/sign-up-card";
import { getWorkspaceInvite } from "@/lib/dbService/workspace-invites";

interface SignUpProps {
  searchParams: Promise<{
    inviteCode: string;
  }>;
}
const SignUp = async ({ searchParams }: SignUpProps) => {
  const { inviteCode } = await searchParams;

  const invite = await getWorkspaceInvite(inviteCode);

  if (!invite) {
    return (
      <p>
        The invite code provided is invalid - it may have already been used or
        expired.
      </p>
    );
  }

  return <SignUpCard />;
};
export default SignUp;
