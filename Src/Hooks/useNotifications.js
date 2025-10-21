import { useNotificationContext } from '../Services/NotificationService';

export const useNotifications = () => {
  return useNotificationContext();
};
