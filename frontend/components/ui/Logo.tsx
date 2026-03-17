import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizes = {
  sm: { full: { width: 100, height: 28 }, icon: { width: 24, height: 24 } },
  md: { full: { width: 130, height: 36 }, icon: { width: 32, height: 32 } },
  lg: { full: { width: 180, height: 50 }, icon: { width: 48, height: 48 } },
};

export default function Logo({ variant = "full", size = "md", href = "/" }: LogoProps) {
  const dimensions = sizes[size][variant];
  const src = variant === "full" ? "/images/Logo.png" : "/images/profile.png";

  const img = (
    <Image
      src={src}
      alt="GoClan"
      width={dimensions.width}
      height={dimensions.height}
      className="object-contain"
      priority
    />
  );

  if (href) {
    return <Link href={href}>{img}</Link>;
  }

  return img;
}