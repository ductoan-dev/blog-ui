import httpRequest from "../utils/httpRequest";

// kind: "image" | "video" — matches POST /media/:kind and its form field
export const uploadMedia = async (kind, file, onProgress) => {
  const form = new FormData();
  form.append(kind, file);

  const result = await httpRequest.post(`/media/${kind}`, form, {
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
    },
  });

  return result.data;
};

export default {
  uploadMedia,
};
