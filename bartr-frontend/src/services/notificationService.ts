import { notificationApi } from './api';

export interface Notification {
  id: string;
  type: string;
  message: string;
  userId: string;
  payload?: any;
  read?: boolean;
  timestamp: string;
}

export const notificationService = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const response = await notificationApi.get<Notification[]>(`/notifications/${userId}`);
    return response.data;
  },
  deleteNotification: async (notificationId: string): Promise<void> => {
    await notificationApi.delete(`/notifications/${notificationId}`);
  },
};

