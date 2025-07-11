import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReportsClient from "@/features/reports/components/reports-client";

const ReportsPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return <ReportsClient />;
};

export default ReportsPage;
