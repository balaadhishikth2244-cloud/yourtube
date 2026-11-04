import { db } from "@/lib/firebase";
import {
  doc, setDoc, serverTimestamp,
  collection, query, where, orderBy, onSnapshot
} from "firebase/firestore";

export interface WatchHistoryEntry {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  watchedAt: any; // Firestore Timestamp
}

export async function recordWatch(userId: string, video: {
  id: string; title: string; channel: string; thumbnail: string; views: number;
}) {
  if (!userId) return;
  const ref = doc(db, "watchHistory", `${userId}_${video.id}`);
  await setDoc(ref, {
    userId,
    videoId: video.id,
    title: video.title,
    channel: video.channel,
    thumbnail: video.thumbnail,
    views: video.views,
    watchedAt: serverTimestamp(),
  }, { merge: true });
}

export function subscribeToHistory(userId: string, callback: (entries: WatchHistoryEntry[]) => void) {
  const q = query(
    collection(db, "watchHistory"),
    where("userId", "==", userId),
    orderBy("watchedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as WatchHistoryEntry)));
  });
}

export function formatRelativeTime(timestamp: any): string {
  if (!timestamp?.toDate) return "just now";
  const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
  if (seconds < 60) return "less than a minute ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}