import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface ChannelData {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  handle: string;
  createdAt: any;
}

export async function getChannelByOwner(userId: string): Promise<ChannelData | null> {
  const snap = await getDoc(doc(db, "channels", userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ChannelData;
}

export async function getChannelById(channelId: string): Promise<ChannelData | null> {
  const snap = await getDoc(doc(db, "channels", channelId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ChannelData;
}

export async function createChannel(userId: string, name: string, description: string): Promise<void> {
  const handle = "@" + name.toLowerCase().replace(/[^a-z0-9]/g, "");
  await setDoc(doc(db, "channels", userId), {
    ownerId: userId,
    name,
    description,
    handle,
    createdAt: serverTimestamp(),
  });
}