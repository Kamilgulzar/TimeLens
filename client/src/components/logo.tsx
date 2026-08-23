import Image from "next/image";

type LogoProps = {
  className?: string;
  variant?: "auto" | "onDark";
  alt?: string;
  width?: number;
  height?: number;
};

export function Logo({
  className = "",
  variant = "auto",
  alt = "TimeLens",
  width = 997,
  height = 697,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={width}
      height={height}
      className={`object-contain select-none ${variant === "onDark" ? "invert" : "dark:invert"} ${className}`}
    />
  );
}
