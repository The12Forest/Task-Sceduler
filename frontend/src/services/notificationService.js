/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
};

/**
 * Show a browser notification
 */
export const showNotification = (title, options = {}) => {
  if (Notification.permission !== 'granted') return;

  // Use service worker if available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    });
  } else {
    new Notification(title, options);
  }
};

/**
 * Schedule notifications for tasks with due dates.
 * Returns a cleanup function to clear all timers.
 */
export const scheduleTaskNotifications = (tasks) => {
  const timers = [];

  tasks.forEach((task) => {
    if (task.completed || !task.dueDate) return;

    const dueTime = new Date(task.dueDate).getTime();
    const now = Date.now();
    const delay = dueTime - now;

    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      // Only schedule within next 24h
      const timer = setTimeout(() => {
        showNotification('Task Due!', {
          body: `"${task.name}" is due now.`,
          tag: `task-due-${task._id}`,
        });
      }, delay);
      timers.push(timer);
    } else if (delay <= 0 && delay > -60 * 60 * 1000) {
      // Already past due within last hour — notify immediately
      showNotification('Task Overdue!', {
        body: `"${task.name}" was due ${Math.abs(Math.round(delay / 60000))} minutes ago.`,
        tag: `task-overdue-${task._id}`,
      });
    }
  });

  return () => timers.forEach(clearTimeout);
};
