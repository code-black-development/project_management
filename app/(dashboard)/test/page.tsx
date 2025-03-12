import { generateEmailTemplate, sendEmail } from "@/lib/mailing-functions";

const Page = () => {
  const content = generateEmailTemplate(
    "Jac",
    "http://localhost:3000/sign-up",
    "Tony"
  );
  sendEmail("tony@codeblack.digital", "Test", content);
  return <div>Page</div>;
};

export default Page;
