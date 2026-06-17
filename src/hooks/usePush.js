import { useState, useEffect } from 'react';
import supabase from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (b64) => {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

export function usePush() {
  const { user } = useAuth();
  const [permission, setPermission]   = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(false);

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isIOSStandalone = isIOS && typeof window !== 'undefined' && window.navigator.standalone === true;
  const iosNeedsPWA = isIOS && !isIOSStandalone;

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && !!VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!isSupported || !user) return;
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    );
  }, [user, isSupported]);

  const subscribe = async () => {
    if (!isSupported || !user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const p256dh = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh'))));
      const auth   = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth'))));
      await supabase.from('push_subscriptions').upsert(
        { user_id: user.id, endpoint: sub.endpoint, p256dh, auth },
        { onConflict: 'user_id,endpoint' }
      );
      setSubscribed(true);
    } catch (e) {
      console.error('[Push subscribe]', e.message);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    if (!isSupported || !user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase.from('push_subscriptions').delete()
          .eq('user_id', user.id).eq('endpoint', sub.endpoint);
      }
      setSubscribed(false);
    } catch (e) {
      console.error('[Push unsubscribe]', e.message);
    }
    setLoading(false);
  };

  const toggle = async () => {
    if (subscribed) { await unsubscribe(); return; }
    if (permission === 'denied') return;
    if (permission !== 'granted') {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;
    }
    await subscribe();
  };

  return { isSupported, iosNeedsPWA, permission, subscribed, loading, toggle };
}
