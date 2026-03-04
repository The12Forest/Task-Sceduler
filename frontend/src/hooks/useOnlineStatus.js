import { useState, useEffect, useRef, useCallback } from 'react';

const HEALTH_URL = '/api/health';
const POLL_INTERVAL = 15_000;   // check every 15 s
const PING_TIMEOUT  = 5_000;    // give the server 5 s to respond

/**
 * Hook to track real server reachability — not just browser connectivity.
 * Pings /api/health periodically and on browser online/offline events.
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const timerRef = useRef(null);

  const checkServer = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), PING_TIMEOUT);
      const res = await fetch(HEALTH_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal,
      });
      clearTimeout(id);
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkServer();

    // Poll on interval
    timerRef.current = setInterval(checkServer, POLL_INTERVAL);

    // Also react to browser connectivity changes immediately
    const onOnline  = () => checkServer();
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [checkServer]);

  return isOnline;
};
