"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageFilePreviewProps {
  file?: File | null;
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
}

export function ImageFilePreview({
  file,
  src,
  alt,
  className,
  imageClassName,
  iconClassName,
}: ImageFilePreviewProps) {
  const objectUrl = useObjectUrl(file);
  const imageSrc = objectUrl ?? src;

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          className={cn("size-full object-cover", imageClassName)}
        />
      ) : (
        <ImageIcon
          className={cn("size-6 text-muted-foreground", iconClassName)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function useObjectUrl(file: File | null | undefined) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Object URLs are browser resources that are created and revoked after file selection.
      setObjectUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);

    return () => {
      URL.revokeObjectURL(nextObjectUrl);
    };
  }, [file]);

  return objectUrl;
}
