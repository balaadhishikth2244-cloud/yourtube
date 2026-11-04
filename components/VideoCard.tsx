"use client";

import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface VideoCardProps {
  title: string;
  youtubeId: string;
  downloadUrl: string;
}

export default function VideoCard({ title, youtubeId, downloadUrl }: VideoCardProps) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleDownload = async () => {
    if (!user) {
      alert("Please sign in to download videos.");
      return;
    }

    setDownloading(true);
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();

    const today = new Date().toDateString();
    const lastDate = data?.lastDownloadDate?.toDate?.()?.toDateString?.() || "";
    const downloadsToday = lastDate === today ? (data?.downloadsToday || 0) : 0;
    const plan = data?.plan || "free";

    if (plan === "free" && downloadsToday >= 1) {
      alert("Free users can only download 1 video per day. Upgrade to premium for unlimited downloads!");
      setDownloading(false);
      handleUpgrade();
      return;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await updateDoc(userRef, {
      downloadsToday: downloadsToday + 1,
      lastDownloadDate: new Date(),
    });

    setDownloading(false);
  };

  const handleUpgrade = async () => {
    if (!user) {
      alert("Please sign in first.");
      return;
    }
    setUpgrading(true);
    const res = await fetch("/api/create-order", { method: "POST" });
    const order = await res.json();
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "YouTube Clone Premium",
      description: "Unlimited video downloads",
      order_id: order.id,
      handler: async function () {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { plan: "premium" });
        alert("🎉 You are now a Premium user! Enjoy unlimited downloads.");
        setUpgrading(false);
      },
      prefill: { name: user.displayName, email: user.email },
      theme: { color: "#ff0000" },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    setUpgrading(false);
  };

  return (
    <div style={{ border: "1px solid #333", borderRadius: "8px", overflow: "hidden", marginBottom: "20px", backgroundColor: "#111" }}>
      <iframe
        width="100%"
        height="250"
        src={`https://www.youtube.com/embed/${youtubeId}`}
        allowFullScreen
        style={{ display: "block" }}
      />
      <div style={{ padding: "12px" }}>
        <h3 style={{ color: "#fff", margin: "0 0 10px 0" }}>{title}</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{ padding: "8px 16px", backgroundColor: "#ff0000", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {downloading ? "Downloading..." : "⬇️ Download"}
          </button>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            style={{ padding: "8px 16px", backgroundColor: "#ffd700", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            ⭐ Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
}