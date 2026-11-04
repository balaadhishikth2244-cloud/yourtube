import { db } from "@/lib/firebase";
import {
  collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, serverTimestamp
} from "firebase/firestore";

export interface UploadedVideo {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  thumbnail: string;
  videoUrl: string;
  views: number;
  duration: string;
  description: string;
  createdAt: any;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export async function uploadVideo(
  userId: string,
  channelName: string,
  file: File,
  title: string,
  description: string,
  onProgress: (percent: number) => void
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset!);
  formData.append("resource_type", "video");

  const { videoUrl, thumbnailUrl, duration } = await new Promise<{
    videoUrl: string; thumbnailUrl: string; duration: number;
  }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const thumbUrl = data.secure_url.replace(/\.[^/.]+$/, ".jpg");
        resolve({
          videoUrl: data.secure_url,
          thumbnailUrl: thumbUrl,
          duration: data.duration || 0,
        });
      } else {
        reject(new Error("Cloudinary upload failed: " + xhr.responseText));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });

  const docRef = await addDoc(collection(db, "uploadedVideos"), {
    ownerId: userId,
    channel: channelName,
    title,
    description,
    videoUrl,
    thumbnail: thumbnailUrl,
    duration: formatDuration(duration),
    views: 0,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getUploadedVideosByChannel(userId: string): Promise<UploadedVideo[]> {
  const q = query(
    collection(db, "uploadedVideos"),
    where("ownerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, channelId: userId, ...d.data() } as UploadedVideo));
}

export async function getAllUploadedVideos(): Promise<UploadedVideo[]> {
  const q = query(collection(db, "uploadedVideos"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, channelId: d.data().ownerId, ...d.data() } as UploadedVideo));
}

export async function getUploadedVideoById(videoId: string): Promise<UploadedVideo | null> {
  const snap = await getDoc(doc(db, "uploadedVideos", videoId));
  if (!snap.exists()) return null;
  return { id: snap.id, channelId: snap.data().ownerId, ...snap.data() } as UploadedVideo;
}