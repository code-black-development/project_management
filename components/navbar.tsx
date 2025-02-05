/* import NavbarRoutes from "@/components/navbar-routes";
import MobileSidebar from "./mobile-sidebar"; */
import { UserButton } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";

const Navbar = () => {
  return (
    <nav className="pt-4 px-6 flex flex-row items-center justify-between w-full">
      {/* <MobileSidebar />
      <NavbarRoutes /> */}
      <div className="flex-col hidden lg:flex">
        <h1 className="text-2xl font-semibold">Home</h1>
        <p className="text-muted-foreground">
          Monitor all of your projects and tasks here
        </p>
      </div>
      <MobileSidebar />
      <UserButton />
    </nav>
  );
};
export default Navbar;
