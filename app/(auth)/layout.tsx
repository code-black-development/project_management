import Logo from "@/components/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}
const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <main className="bg-neutral-100 min-h-screen ">
      <div className="mx-auto max-w-screen-2xl p-4">
        <nav className="flex justify-between items-center">
          <Logo />
        </nav>
        <div className="flex flex-col items-center justify-center p-4 md:pt-14">
          {children}
        </div>
      </div>
    </main>
  );
};
export default AuthLayout;
