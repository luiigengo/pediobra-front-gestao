import Image from "next/image";

import { cn } from "@/lib/utils";

export const PEDIOBRA_LOGO_SRC = "/brand/pediobra-logo.svg";

export function PediObraLogo({
  alt = "",
  className,
  priority = false,
}: {
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={PEDIOBRA_LOGO_SRC}
      alt={alt}
      width={32}
      height={32}
      priority={priority}
      className={cn("size-8 shrink-0", className)}
    />
  );
}
