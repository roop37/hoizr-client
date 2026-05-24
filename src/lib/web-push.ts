"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";
import { gqlRequest } from "@/lib/graphql";
import {
  REGISTER_FCM_TOKEN_MUTATION,
  UNREGISTER_FCM_TOKEN_MUTATION,
} from "@/lib/queries";

const TOKEN_STORAGE_KEY = "hoizr:fcm:token";
const DISMISSED_STORAGE_KEY = "hoizr:fcm:dismissed";

type FirebaseBrowserConfig = {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
};

const firebaseConfig: FirebaseBrowserConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

export const isWebPushConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      vapidKey
  );

export const hasDismissedWebPushPrompt = () => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "1";
};

export const dismissWebPushPrompt = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
};

const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") return null;
  if (!isWebPushConfigured()) return null;
  if (!(await isSupported())) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getMessaging(app);
};

const registerServiceWorker = async () => {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  if (firebaseConfig.authDomain) {
    params.set("authDomain", firebaseConfig.authDomain);
  }
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`
  );
};

export const registerCustomerWebPush = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  const registration = await registerServiceWorker();
  const fcmToken = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!fcmToken) return null;

  await gqlRequest<{ registerFcmToken: boolean }>(
    REGISTER_FCM_TOKEN_MUTATION,
    { fcmToken }
  );
  window.localStorage.setItem(TOKEN_STORAGE_KEY, fcmToken);

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Hoizr";
    const body = payload.notification?.body;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icon-192.png",
        data: payload.data,
      });
    }
  });

  return fcmToken;
};

export const unregisterStoredWebPushToken = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored) return;

  try {
    await gqlRequest<{ unregisterFcmToken: boolean }>(
      UNREGISTER_FCM_TOKEN_MUTATION,
      { fcmToken: stored }
    );
  } catch {
    // Logout must continue even if the token cleanup request fails.
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (messaging) await deleteToken(messaging);
  } catch {
    // Best effort only; the server-side $pull above is the important bit.
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};
