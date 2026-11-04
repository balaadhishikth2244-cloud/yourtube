import { db } from "@/lib/firebase";
import {
  doc, setDoc, deleteDoc, getDoc, getDocs, getCountFromServer,
  collection, query, where
} from "firebase/firestore";

export interface SubscriptionEntry {
  id: string;
  subscriberId: string;
  channelId: string;
  channelName: string;
  subscribedAt: any;
}

function subDocId(subscriberId: string, channelId: string) {
  return `${subscriberId}_${channelId}`;
}

export async function subscribeToChannel(subscriberId: string, channelId: string, channelName: string) {
  if (!subscriberId || !channelId) return;
  const ref = doc(db, "subscriptions", subDocId(subscriberId, channelId));
  await setDoc(ref, {
    subscriberId,
    channelId,
    channelName,
    subscribedAt: new Date(),
  });
}

export async function unsubscribeFromChannel(subscriberId: string, channelId: string) {
  if (!subscriberId || !channelId) return;
  await deleteDoc(doc(db, "subscriptions", subDocId(subscriberId, channelId)));
}

export async function isSubscribedTo(subscriberId: string, channelId: string): Promise<boolean> {
  if (!subscriberId || !channelId) return false;
  const snap = await getDoc(doc(db, "subscriptions", subDocId(subscriberId, channelId)));
  return snap.exists();
}

export async function getSubscriberCount(channelId: string): Promise<number> {
  const q = query(collection(db, "subscriptions"), where("channelId", "==", channelId));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getUserSubscriptions(subscriberId: string): Promise<SubscriptionEntry[]> {
  const q = query(collection(db, "subscriptions"), where("subscriberId", "==", subscriberId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionEntry));
}