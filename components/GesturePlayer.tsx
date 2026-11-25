"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { videos as staticVideos } from "@/lib/videos";
import { getAllUploadedVideos } from "@/lib/uploadedVideos";

interface GesturePlayerProps {
  videoUrl: string;
  videoId: string;
  onOpenComments: () => void;
  maxWatchSeconds?: number | null; // null / undefined = unlimited
  planName?: string;
}

export default function GesturePlayer({ videoUrl, videoId, onOpenComments, maxWatchSeconds, planName }: GesturePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [tapCount, setTapCount] = useState(0);
  const [tapPosition, setTapPosition] = useState<"left" | "center" | "right">("center");
  const [hint, setHint] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  // New video or new plan: clear the "limit reached" screen
  useEffect(() => { setLimitReached(false); }, [videoId, maxWatchSeconds]);

  // Stop playback when the plan's watch-time limit is reached
  const enforceLimit = () => {
    const v = videoRef.current;
    if (!v || !maxWatchSeconds) return;
    if (v.currentTime >= maxWatchSeconds) {
      v.pause();
      v.currentTime = Math.max(0, maxWatchSeconds - 0.1);
      setLimitReached(true);
    }
  };
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  // Playlist for "next video": uploaded videos (newest first) followed by the static ones
  const [playlist, setPlaylist] = useState<{ id: string }[]>(staticVideos.map(v => ({ id: v.id })));

  useEffect(() => {
    getAllUploadedVideos()
      .then((uploaded) => {
        setPlaylist([
          ...uploaded.map(v => ({ id: v.id })),
          ...staticVideos.map(v => ({ id: v.id })),
        ]);
      })
      .catch(() => {});
  }, []);

  const currentIndex = playlist.findIndex(v => v.id === videoId);

  const showHint = (text: string) => {
    setHint(text);
    setTimeout(() => setHint(""), 1500);
  };

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const el = (e.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const third = rect.width / 3;

    let pos: "left" | "center" | "right" = "center";
    if (x < rect.left + third) pos = "left";
    else if (x > rect.left + 2 * third) pos = "right";

    const newCount = tapPosition === pos ? tapCount + 1 : 1;
    setTapCount(newCount);
    setTapPosition(pos);

    if (tapTimer.current) clearTimeout(tapTimer.current);

    tapTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      if (newCount === 1) {
        // Single tap center = play/pause
        if (pos === "center") {
          if (video.paused) { video.play(); showHint("▶ Play"); }
          else { video.pause(); showHint("⏸ Pause"); }
        }
      } else if (newCount === 2) {
        // Double tap
        if (pos === "right") {
          video.currentTime += 10;
          showHint("⏩ +10s");
        } else if (pos === "left") {
          video.currentTime -= 10;
          showHint("⏪ -10s");
        }
      } else if (newCount === 3) {
        // Triple tap
        if (pos === "center") {
          if (playlist.length < 2) {
            showHint("No other videos yet");
          } else {
            const nextVideo = playlist[(currentIndex + 1) % playlist.length];
            router.push(`/video/${nextVideo.id}`);
            showHint("⏭ Next Video");
          }
        } else if (pos === "right") {
          showHint("❌ Closing...");
          setTimeout(() => window.close(), 800);
        } else if (pos === "left") {
          onOpenComments();
          showHint("💬 Comments");
        }
      }

      setTapCount(0);
    }, 300);
  }, [tapCount, tapPosition, currentIndex, playlist, router, onOpenComments]);

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        onTimeUpdate={enforceLimit}
        onSeeking={enforceLimit}
        onPlay={() => { if (limitReached) videoRef.current?.pause(); }}
        style={{ width: "100%", backgroundColor: "#000", display: "block" }}
      />

      {/* Watch-time limit reached */}
      {limitReached && maxWatchSeconds ? (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.88)", color: "#fff",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "12px", textAlign: "center", padding: "20px",
        }}>
          <div style={{ fontSize: "36px" }}>⏱️</div>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            Watch limit reached ({Math.floor(maxWatchSeconds / 60)} min on the {planName || "Free"} plan)
          </div>
          <div style={{ fontSize: "14px", color: "#ccc" }}>
            Upgrade your plan to keep watching this video.
          </div>
          <Link href="/plans" style={{
            padding: "10px 24px", backgroundColor: "#ff0000", color: "#fff",
            borderRadius: "20px", textDecoration: "none", fontWeight: "bold", fontSize: "14px",
          }}>
            ⭐ Upgrade plan
          </Link>
        </div>
      ) : null}

      {/* Gesture overlay */}
      <div
        onClick={handleTap}
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          bottom: "40px", // leave controls visible
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>◀◀ double tap</div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>tap</div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>double tap ▶▶</div>
      </div>

      {/* Gesture hint */}
      {hint && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "#fff", padding: "10px 20px",
          borderRadius: "8px", fontSize: "18px",
          pointerEvents: "none",
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}