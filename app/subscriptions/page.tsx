"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/lib/useTheme";
import SignInButton from "@/components/SignInButton";
import { getUserSubscriptions } from "@/lib/subscriptions";
import { getUploadedVideosByChannel, UploadedVideo } from "@/lib/uploadedVideos";

export default function SubscriptionsPage() {
  const { user, loading } = useAuth();
  const { isLight } = useTheme();
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [fetching, setFetching] = useState(true);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) { setFetching(false); return; }

    getUserSubscriptions(user.uid).then(async (subs) => {
      setChannelCount(subs.length);
      const allVideos = await Promise.all(
        subs.map((s) => getUploadedVideosByChannel(s.channelId))
      );
      const merged = allVideos.flat().sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setVideos(merged);
      setFetching(false);
    });
  }, [user, loading]);

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#ffffff" : "#212121";
  const cardBg = isLight ? "#f9f9f9" : "#212121";
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

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "80px 24px 24px" }}>
        <h1 style={{ color: textColor, fontSize: "22px", marginBottom: "4px" }}>Subscriptions</h1>
        <p style={{ color: subColor, fontSize: "14px", marginBottom: "24px" }}>
          {channelCount} channel{channelCount !== 1 ? "s" : ""}
        </p>

        {loading || fetching ? (
          <p style={{ color: subColor }}>Loading...</p>
        ) : !user ? (
          <p style={{ color: subColor }}>Sign in to see videos from channels you follow.</p>
        ) : channelCount === 0 ? (
          <p style={{ color: subColor }}>
            You haven't subscribed to any channels yet. Visit a channel page and hit Subscribe.
          </p>
        ) : videos.length === 0 ? (
          <p style={{ color: subColor }}>The channels you follow haven't posted any videos yet.</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px"
          }}>
            {videos.map((v) => (
              <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: "none" }}>
                <div style={{ cursor: "pointer" }}>
                  <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", backgroundColor: cardBg }}>
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300x180?text=Video")}
                    />
                    <span style={{
                      position: "absolute", bottom: "6px", right: "6px",
                      backgroundColor: "rgba(0,0,0,0.8)", color: "#fff",
                      fontSize: "12px", padding: "2px 6px", borderRadius: "4px"
                    }}>
                      {v.duration}
                    </span>
                  </div>
                  <div style={{ padding: "12px 0" }}>
                    <p style={{ color: textColor, margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold" }}>
                      {v.title}
                    </p>
                    <p style={{ color: subColor, margin: "0 0 2px 0", fontSize: "13px" }}>
                      {v.channel}
                    </p>
                    <p style={{ color: subColor, margin: 0, fontSize: "12px" }}>
                      {(v.views / 1000).toFixed(1)}K views
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}