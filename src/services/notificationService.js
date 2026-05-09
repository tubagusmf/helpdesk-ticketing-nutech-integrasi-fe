import API from "./api";

export const getNotifications = async () => {
  const res = await API.get("/notifications");
  return res.data.data;
};

export const getUnreadCount = async () => {
  const res = await API.get("/notifications/unread/count");

  return res.data.total_unread || 0;
};

export const markNotificationRead = async (id) => {
  const res = await API.put(`/notifications/${id}/read`);
  return res.data;
};