import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/">
      <Image src="/logo.svg" alt="Logo" width={154} height={27} />
    </Link>
  );
};
export default Logo;
