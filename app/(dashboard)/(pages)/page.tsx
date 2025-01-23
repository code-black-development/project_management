import WorkspaceForm from "@/components/workspace-form";
import { UserButton } from "@clerk/nextjs";
const Page = () => {
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
