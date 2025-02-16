import { Avatar } from "@/components/ui/avatar";
import { auth } from "@/auth";
interface UserButtonProps {}

const UserButton = async ({}: UserButtonProps) => {
  const session = await auth();

  return (
    <div>
      <Avatar />
      <p>{session?.user?.name}</p>
    </div>
  );
};

export default UserButton;
