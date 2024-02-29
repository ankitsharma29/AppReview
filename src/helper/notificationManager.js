import PushNotification, {Importance} from 'react-native-push-notification';

class NotificationManager {
  configure = () => {
    PushNotification.configure({
      onNotification: this.onNotification,
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
    });
  };

  scheduleNotification = (title, message) => {
    PushNotification.createChannel({
      channelId: 'Learn',
      channelName: 'Learn App',
      channelDescription: 'A channel to categories your notifications',
      playSound: false,
      soundName: 'default',
      importance: Importance.HIGH,
      vibrate: true,
    });
    setTimeout(() => {
      PushNotification.localNotification({
        title: title,
        message: message,
        channelId: 'Learn',
        vibrate: true,
        vibration: 3000,
        // priority: 'high',
      });
    }, 1000);
    PushNotification.removeAllDeliveredNotifications();
  };

  onNotification = notification => {
    console.log('Notification:', notification);
  };
}

const notificationManager = new NotificationManager();
export default notificationManager;
