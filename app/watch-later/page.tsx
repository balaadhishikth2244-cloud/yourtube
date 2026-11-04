"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/lib/useTheme";
import SignInButton from "@/components/SignInButton";
import { subscribeToWatchLater, removeFromWatchLater, WatchLaterEntry } from "@/lib/watchLater";

export default function WatchLaterPage() {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const [items, setItems] = useState<WatchLaterEntry[]>([]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    const unsub = subscribeToWatchLater(user.uid, setItems);
    return () => unsub();
  }, [user]);

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#ffffff" : "#212121";
  const textColor = isLight ? "#000" : "#fff";
  const subColor = isLight ? "#555" : "#aaa";
  const cardBg = isLight ? "#f2f2f2" : "#272727";
  const borderColor = isLight ? "#e0e0e0" : "#333";

  const handleRemove = async (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await removeFromWatchLater(user.uid, videoId);
  };

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", fontFamily: "Roboto, Arial, sans-serif" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", backgroundColor: headerBg,
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        borderBottom: `1px solid ${borderColor}`, height: "56px"
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
          <span style={{ color: textColor, fontSize: "18px", fontWeight: "bold" }}>YourTube</span>
          <span style={{ color: subColor, fontSize: "10px", marginTop: "8px" }}>IN</span>
        </Link>
        <SignInButton />
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 24px 24px" }}>
        <h1 style={{ color: textColor, fontSize: "22px", marginBottom: "4px" }}>Watch Later</h1>
        <p style={{ color: subColor, fontSize: "14px", marginBottom: "24px" }}>
          {items.length} video{items.length !== 1 ? "s" : ""}
        </p>

        {!user && <p style={{ color: subColor }}>Sign in to see your saved videos.</p>}
        {user && items.length === 0 && <p style={{ color: subColor }}>No videos saved for later.</p>}

        {items.map((entry) => (
          <Link key={entry.id} href={`/video/${entry.videoId}`} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", cursor: "pointer" }}>
              <img
                src={entry.thumbnail}
                alt={entry.title}
                style={{ width: "168px", height: "94px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/168x94?text=Video")}
              />
              <div style={{ flex: 1 }}>
                <p style={{ color: textColor, margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold" }}>
                  {entry.title}
                </p>
                <p style={{ color: subColor, margin: "0 0 4px 0", fontSize: "13px" }}>{entry.channel}</p>
                <p style={{ color: subColor, margin: 0, fontSize: "13px" }}>
                  {(entry.views / 1000).toFixed(0)}K views
                </p>
              </div>
              <button
                onClick={(e) => handleRemove(e, entry.videoId)}
                style={{
                  padding: "8px 14px", borderRadius: "20px", border: "none",
                  cursor: "pointer", fontSize: "13px", backgroundColor: cardBg, color: textColor,
                  flexShrink: 0
                }}
              >
                Remove
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}