import httpRequest from "../utils/httpRequest";

export const uploadVideo = async (file, onProgress) => {
  const form = new FormData();
  form.append("video", file);

  const result = await httpRequest.post("/media/video", form, {
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
    },
  });

  return result.data;
};

export default {
  uploadVideo,
};
