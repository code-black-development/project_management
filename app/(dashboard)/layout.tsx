import { auth } from "@/auth";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import DashboardModals from "@/components/dashboard-modals";
import { redirect } from "next/navigation";
import prisma from "@/prisma/prisma";

export const dynamic = "force-dynamic";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Check emailVerified — only block if there's an active verification token.
  // Existing users (created before email verification was introduced) have no
  // emailVerified and no pending token — they must not be blocked.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, email: true },
  });

  if (!dbUser?.emailVerified) {
    const pendingToken = await prisma.verificationToken.findFirst({
      where: { identifier: dbUser?.email ?? "" },
    });
    if (pendingToken) {
      redirect(`/verify-email?email=${encodeURIComponent(session.user.email ?? "")}`);
    }
  }

  return (
    // Todo: could make sidebar collapsible in which case the pl of the main tag would be 56 or 0 based on the state of the sidebar
    <div className="min-h-sctreen">
      <DashboardModals />
      <div className="flex w-full h-full">
        <div className="fixed left-0 top-0 hidden lg:block h-full lg:w-[264px] overflow-y-auto">
          <Sidebar />
        </div>
        <div className="lg:pl-[264px] w-full">
          <div className="mx-auto max-w-screen-2xl h-full">
            <Navbar />

            <main className="h-full pt-4 pb-8 px-6 flex flex-col">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
