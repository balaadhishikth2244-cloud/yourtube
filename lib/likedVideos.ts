import { db } from "@/lib/firebase";
import {
  doc, setDoc, deleteDoc, getDoc, serverTimestamp,
  collection, query, where, orderBy, onSnapshot
} from "firebase/firestore";

export interface LikedVideoEntry {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  duration: string;
  likedAt: any;
}

export async function likeVideo(userId: string, video: {
  id: string; title: string; channel: string; thumbnail: string; views: number; duration: string;
}) {
  if (!userId) return;
  const ref = doc(db, "likedVideos", `${userId}_${video.id}`);
  await setDoc(ref, {
    userId,
    videoId: video.id,
    title: video.title,
    channel: video.channel,
    thumbnail: video.thumbnail,
    views: video.views,
    duration: video.duration,
    likedAt: serverTimestamp(),
  });
}

export async function unlikeVideo(userId: string, videoId: string) {
  if (!userId) return;
  await deleteDoc(doc(db, "likedVideos", `${userId}_${videoId}`));
}

export async function isVideoLiked(userId: string, videoId: string): Promise<boolean> {
  if (!userId) return false;
  const snap = await getDoc(doc(db, "likedVideos", `${userId}_${videoId}`));
  return snap.exists();
}

export function subscribeToLikedVideos(userId: string, callback: (entries: LikedVideoEntry[]) => void) {
  const q = query(
    collection(db, "likedVideos"),
    where("userId", "==", userId),
    orderBy("likedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as LikedVideoEntry)));
  });
}