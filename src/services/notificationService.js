import httpRequest from "@/utils/httpRequest";

const notificationService = {
  getAll: () => httpRequest.get("/notifications"),
  markRead: (id) => httpRequest.patch(`/notifications/${id}/read`),
  markAllRead: () => httpRequest.patch("/notifications/read-all"),
};

export default notificationService;
