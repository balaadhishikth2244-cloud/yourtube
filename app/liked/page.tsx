"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/lib/useTheme";
import SignInButton from "@/components/SignInButton";
import { subscribeToLikedVideos, LikedVideoEntry } from "@/lib/likedVideos";

export default function LikedVideosPage() {
  const { user, loading } = useAuth();
  const { isLight } = useTheme();
  const [liked, setLiked] = useState<LikedVideoEntry[]>([]);

  useEffect(() => {
    if (loading) return;   // wait until Firebase auth has fully resolved
    if (!user) { setLiked([]); return; }
    const unsub = subscribeToLikedVideos(user.uid, setLiked);
    return () => unsub();
  }, [user, loading]);

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#ffffff" : "#212121";
  const textColor = isLight ? "#000" : "#fff";
  const subColor = isLight ? "#555" : "#aaa";
  const borderColor = isLight ? "#e0e0e0" : "#333";

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
        <h1 style={{ color: textColor, fontSize: "22px", marginBottom: "4px" }}>Liked Videos</h1>
        <p style={{ color: subColor, fontSize: "14px", marginBottom: "24px" }}>
          {liked.length} video{liked.length !== 1 ? "s" : ""}
        </p>

        {loading && <p style={{ color: subColor }}>Loading...</p>}
        {!loading && !user && <p style={{ color: subColor }}>Sign in to see videos you've liked.</p>}
        {!loading && user && liked.length === 0 && <p style={{ color: subColor }}>You haven't liked any videos yet.</p>}

        {liked.map((entry) => (
          <Link key={entry.id} href={`/video/${entry.videoId}`} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", cursor: "pointer" }}>
              <img
                src={entry.thumbnail}
                alt={entry.title}
                style={{ width: "168px", height: "94px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/168x94?text=Video")}
              />
              <div>
                <p style={{ color: textColor, margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold" }}>
                  {entry.title}
                </p>
                <p style={{ color: subColor, margin: "0 0 4px 0", fontSize: "13px" }}>{entry.channel}</p>
                <p style={{ color: subColor, margin: 0, fontSize: "13px" }}>
                  {(entry.views / 1000).toFixed(0)}K views
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}