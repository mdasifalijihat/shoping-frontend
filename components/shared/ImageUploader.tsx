"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { uploadSingleImage } from "@/app/services/media.service";
import { Button } from "@/components/ui/button";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxFileSize = 5 * 1024 * 1024;

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
  onUploadStateChange?: (pending: boolean) => void;
}

export function ImageUploader({
  value,
  disabled,
  onChange,
  onUploadStateChange,
}: ImageUploaderProps) {
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const [pending, setPending] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>();
  const url = value === undefined ? uploadedUrl : value;
  const preview =
    url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? url : null;

  async function upload(file: File) {
    if (disabled || uploading.current) return;
    if (!imageTypes.includes(file.type) || file.size > maxFileSize) {
      toast.error("Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.");
      return;
    }

    uploading.current = true;
    setPending(true);
    onUploadStateChange?.(true);
    try {
      const { url } = await uploadSingleImage(file);
      setUploadedUrl(url);
      onChange(url);
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload the image.",
      );
    } finally {
      uploading.current = false;
      setPending(false);
      onUploadStateChange?.(false);
    }
  }

  return (
    <div className="grid gap-3">
      {preview && (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
          <Image
            src={preview}
            unoptimized={
              !preview.startsWith("/") &&
              !preview.startsWith("https://res.cloudinary.com/")
            }
            alt="Uploaded image preview"
            fill
            sizes="(max-width: 400px) 100vw, 384px"
            className="object-contain"
          />
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-24 w-full flex-col gap-2 border-dashed px-4 py-5 text-center whitespace-normal"
        onClick={() => input.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) void upload(file);
        }}
        disabled={pending || disabled}
        aria-busy={pending}
      >
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <ImagePlus aria-hidden="true" />
        )}
        {pending ? "Uploading image..." : "Drop an image here or choose a file"}
      </Button>
      <input
        ref={input}
        type="file"
        accept={imageTypes.join(",")}
        hidden
        disabled={pending || disabled}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
