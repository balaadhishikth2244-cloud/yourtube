import { db } from "@/lib/firebase";
import {
  doc, setDoc, deleteDoc, getDoc, serverTimestamp,
  collection, query, where, orderBy, onSnapshot
} from "firebase/firestore";

export interface WatchLaterEntry {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  duration: string;
  addedAt: any;
}

export async function addToWatchLater(userId: string, video: {
  id: string; title: string; channel: string; thumbnail: string; views: number; duration: string;
}) {
  if (!userId) return;
  const ref = doc(db, "watchLater", `${userId}_${video.id}`);
  await setDoc(ref, {
    userId,
    videoId: video.id,
    title: video.title,
    channel: video.channel,
    thumbnail: video.thumbnail,
    views: video.views,
    duration: video.duration,
    addedAt: serverTimestamp(),
  });
}

export async function removeFromWatchLater(userId: string, videoId: string) {
  if (!userId) return;
  await deleteDoc(doc(db, "watchLater", `${userId}_${videoId}`));
}

export async function isInWatchLater(userId: string, videoId: string): Promise<boolean> {
  if (!userId) return false;
  const snap = await getDoc(doc(db, "watchLater", `${userId}_${videoId}`));
  return snap.exists();
}

export function subscribeToWatchLater(userId: string, callback: (entries: WatchLaterEntry[]) => void) {
  const q = query(
    collection(db, "watchLater"),
    where("userId", "==", userId),
    orderBy("addedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as WatchLaterEntry)));
  });
}