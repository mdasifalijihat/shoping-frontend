import type { IApiResponse } from "@/app/types/api.types";
import api from "@/lib/axios";

export interface UploadedImage {
  url: string;
  publicId: string;
}

export async function uploadSingleImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.postForm<IApiResponse<UploadedImage>>(
    "/media/upload-single",
    formData,
  );
  return data.data;
}

export async function uploadMultipleImages(files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);

  const { data } = await api.postForm<IApiResponse<UploadedImage[]>>(
    "/media/upload-multiple",
    formData,
  );
  return data.data;
}
