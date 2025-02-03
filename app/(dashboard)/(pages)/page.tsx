import WorkspaceForm from "@/features/workspaces/_components/create-workspace-form";
import { auth } from "@clerk/nextjs/server";

const Page = async () => {
  const x = await auth();
  const token = await x.getToken();
  try {
    const data = await fetch("http://localhost:3000/api/workspace/hello", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const res = await data.json();
    console.log(res);
  } catch (e) {
    console.log("error:", e);
  }
  return (
    <div>
      <WorkspaceForm
        initialValues={{
          name: "test",
          image: "/uploaded_files/GOPR3174.JPG",
        }}
      />
    </div>
  );
};
export default Page;
