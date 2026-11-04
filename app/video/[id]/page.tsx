"use client";
import { useParams } from "next/navigation";
import { videos as staticVideos } from "@/lib/videos";
import { useState, useEffect } from "react";
import SignInButton from "@/components/SignInButton";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc, arrayUnion,
  collection, addDoc, query, where,
  onSnapshot, orderBy, deleteDoc
} from "firebase/firestore";
import Link from "next/link";
import { useTheme } from "@/lib/useTheme";
import GesturePlayer from "@/components/GesturePlayer";
import { recordWatch } from "@/lib/watchHistory";
import { likeVideo, unlikeVideo, isVideoLiked } from "@/lib/likedVideos";
import { addToWatchLater, removeFromWatchLater, isInWatchLater } from "@/lib/watchLater";
import { getUploadedVideoById } from "@/lib/uploadedVideos";
import { subscribeToChannel, unsubscribeFromChannel, isSubscribedTo } from "@/lib/subscriptions";

interface VideoData {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  thumbnail: string;
  videoUrl: string;
  views: number;
  duration: string;
  description: string;
  isUploaded: boolean;
}

export default function VideoPage() {
  const { id } = useParams();
  const videoId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const { isLight } = useTheme();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [videoLiked, setVideoLiked] = useState(false);
  const [videoDisliked, setVideoDisliked] = useState(false);
  const [videoLikes, setVideoLikes] = useState(4500);
  const [watchLaterAdded, setWatchLaterAdded] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [comments, setComments] = useState<{
    id: string;
    text: string;
    originalText: string;
    user: string;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    city: string;
  }[]>([]);
  const [selectedLang, setSelectedLang] = useState("hi");
  const [downloading, setDownloading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const languages = [
    { code: "hi", name: "Hindi" },
    { code: "fr", name: "French" },
    { code: "ta", name: "Tamil" },
    { code: "de", name: "German" },
    { code: "te", name: "Telugu" },
  ];

  const userId = typeof window !== "undefined"
    ? sessionStorage.getItem("userId") || (() => {
        const id = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem("userId", id);
        return id;
      })()
    : "anonymous";

  const relatedVideos = staticVideos.filter(v => v.id !== videoId);

  // Resolve video: check static list first, then Firestore uploaded videos
  useEffect(() => {
    if (!videoId) return;
    const staticMatch = staticVideos.find((v) => v.id === videoId);
    if (staticMatch) {
      setVideo({ ...staticMatch, isUploaded: false });
      setLoadingVideo(false);
      return;
    }
    getUploadedVideoById(videoId).then((uploaded) => {
      if (uploaded) {
        setVideo({
          id: uploaded.id,
          title: uploaded.title,
          channel: uploaded.channel,
          channelId: uploaded.channelId,
          thumbnail: uploaded.thumbnail,
          videoUrl: uploaded.videoUrl,
          views: uploaded.views,
          duration: uploaded.duration,
          description: uploaded.description,
          isUploaded: true,
        });
      }
      setLoadingVideo(false);
    });
  }, [videoId]);

  // Comments listener
  useEffect(() => {
    if (!video) return;
    const q = query(
      collection(db, "comments"),
      where("videoId", "==", video.id),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });
    return () => unsub();
  }, [video]);

  // Watch history logger
  useEffect(() => {
    if (!video || !user) return;
    recordWatch(user.uid, {
      id: video.id,
      title: video.title,
      channel: video.channel,
      thumbnail: video.thumbnail,
      views: video.views,
    });
  }, [video, user]);

  // Load saved like / watch-later status
  useEffect(() => {
    if (!video || !user) return;
    isVideoLiked(user.uid, video.id).then(setVideoLiked);
    isInWatchLater(user.uid, video.id).then(setWatchLaterAdded);
  }, [video, user]);

  useEffect(() => {
    if (!video || !user) return;
    isSubscribedTo(user.uid, video.channelId || video.channel).then(setSubscribed).catch(() => {});
  }, [video, user]);

  if (loadingVideo) {
    return <div style={{ color: "#fff", padding: "40px", backgroundColor: "#0f0f0f", minHeight: "100vh" }}>Loading...</div>;
  }

  if (!video) return <div style={{ color: "#fff", padding: "40px", backgroundColor: "#0f0f0f", minHeight: "100vh" }}>Video not found.</div>;

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#ffffff" : "#212121";
  const textColor = isLight ? "#000" : "#fff";
  const subColor = isLight ? "#555" : "#aaa";
  const cardBg = isLight ? "#f2f2f2" : "#272727";
  const borderColor = isLight ? "#e0e0e0" : "#333";

  const handleComment = async () => {
    if (!user) { alert("Please sign in to comment."); return; }
    if (!comment.trim()) return;

    const blocked = /[^a-zA-Z0-9\u0900-\u097F\u0C00-\u0C7F\s.,!?'"]/;
    if (blocked.test(comment)) {
      alert("Special characters are not allowed!");
      return;
    }

    let city = "Unknown";
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      city = data.city || "Unknown";
    } catch {
      city = "Unknown";
    }

    await addDoc(collection(db, "comments"), {
      videoId: video.id,
      text: comment,
      originalText: comment,
      user: user.displayName || "User",
      userId: user.uid,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      city,
      createdAt: new Date(),
    });

    setComment("");
  };

  const handleLike = async (index: number) => {
    const c = comments[index];
    const isLiked = c.likedBy.includes(userId);
    const isDisliked = c.dislikedBy.includes(userId);
    let newLikes = c.likes, newLikedBy = [...c.likedBy];
    let newDislikes = c.dislikes, newDislikedBy = [...c.dislikedBy];

    if (isLiked) { newLikes--; newLikedBy = newLikedBy.filter(u => u !== userId); }
    else if (isDisliked) { newLikes++; newDislikes--; newLikedBy.push(userId); newDislikedBy = newDislikedBy.filter(u => u !== userId); }
    else { newLikes++; newLikedBy.push(userId); }

    await updateDoc(doc(db, "comments", c.id), { likes: newLikes, likedBy: newLikedBy, dislikes: newDislikes, dislikedBy: newDislikedBy });
  };

  const handleDislike = async (index: number) => {
    const c = comments[index];
    const isDisliked = c.dislikedBy.includes(userId);
    const isLiked = c.likedBy.includes(userId);
    let newDislikes = c.dislikes, newDislikedBy = [...c.dislikedBy];
    let newLikes = c.likes, newLikedBy = [...c.likedBy];

    if (isDisliked) { newDislikes--; newDislikedBy = newDislikedBy.filter(u => u !== userId); }
    else if (isLiked) { newDislikes++; newLikes--; newDislikedBy.push(userId); newLikedBy = newLikedBy.filter(u => u !== userId); }
    else { newDislikes++; newDislikedBy.push(userId); }

    if (newDislikes >= 2) { await deleteDoc(doc(db, "comments", c.id)); return; }
    await updateDoc(doc(db, "comments", c.id), { dislikes: newDislikes, dislikedBy: newDislikedBy, likes: newLikes, likedBy: newLikedBy });
  };

  const translateComment = async (index: number, originalText: string, lang: string) => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalText)}&langpair=en%7C${lang}`;
      const res = await fetch(url);
      const data = await res.json();
      setComments(prev => prev.map((c, i) => i === index ? { ...c, text: data.responseData.translatedText } : c));
    } catch { alert("Translation failed."); }
  };

  const handleDownload = async () => {
    if (!user) { alert("Please sign in to download."); return; }
    if (video.isUploaded) { alert("Downloads aren't available for uploaded videos yet."); return; }
    setDownloading(true);
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();
    const today = new Date().toDateString();
    const lastDate = data?.lastDownloadDate?.toDate?.()?.toDateString?.() || "";
    const downloadsToday = lastDate === today ? (data?.downloadsToday || 0) : 0;
    const plan = data?.plan || "free";
    const maxDownloads: Record<string, number> = { free: 1, bronze: 5, silver: 20, gold: 999 };
    const limit = maxDownloads[plan] ?? 1;
    if (downloadsToday >= limit) {
      alert(`${plan} plan allows ${limit} download(s)/day. Upgrade!`);
      setDownloading(false);
      return;
    }
    const link = document.createElement("a");
    link.href = video.videoUrl;
    link.download = `${video.title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    await updateDoc(userRef, {
      downloadsToday: downloadsToday + 1,
      lastDownloadDate: new Date(),
      downloads: arrayUnion({ videoId: video.id, title: video.title, thumbnail: video.thumbnail, downloadedAt: new Date().toISOString() }),
    });
    setDownloading(false);
  };

  const handleUpgrade = async () => {
    if (!user) { alert("Please sign in first."); return; }
    setUpgrading(true);

    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }

    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 99 }),
    });
    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount, currency: order.currency,
      name: "YouTube Clone Premium", description: "Unlimited video downloads",
      order_id: order.id,
      handler: async function () {
        await updateDoc(doc(db, "users", user.uid), { plan: "premium" });
        alert("🎉 You are now Premium!");
        setUpgrading(false);
      },
      prefill: { name: user.displayName, email: user.email },
      theme: { color: "#ff0000" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    setUpgrading(false);
  };

  const handleSubscribe = async () => {
    if (!user) { alert("Please sign in to subscribe."); return; }
    if (!video) return;
    const channelId = video.channelId || video.channel; // channel page uses the owner's uid as the ID
    const next = !subscribed;
    setSubscribed(next);
    try {
      if (next) {
        await subscribeToChannel(user.uid, channelId, video.channel);
      } else {
        await unsubscribeFromChannel(user.uid, channelId);
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      alert("Something went wrong: " + (err as Error).message);
      setSubscribed(!next);
    }
  };

  const handleVideoLike = async () => {
    if (!user) { alert("Please sign in to like."); return; }
    if (videoDisliked) setVideoDisliked(false);
    if (videoLiked) {
      setVideoLiked(false);
      setVideoLikes(prev => prev - 1);
      await unlikeVideo(user.uid, video.id);
    } else {
      setVideoLiked(true);
      setVideoLikes(prev => prev + 1);
      await likeVideo(user.uid, {
        id: video.id,
        title: video.title,
        channel: video.channel,
        thumbnail: video.thumbnail,
        views: video.views,
        duration: video.duration,
      });
    }
  };

  const handleVideoDislike = () => {
    if (!user) { alert("Please sign in to dislike."); return; }
    if (videoLiked) {
      setVideoLiked(false);
      setVideoLikes(prev => prev - 1);
      unlikeVideo(user.uid, video.id);
    }
    setVideoDisliked(!videoDisliked);
  };

  const handleWatchLater = async () => {
    if (!user) { alert("Please sign in to save videos."); return; }
    if (watchLaterAdded) {
      setWatchLaterAdded(false);
      await removeFromWatchLater(user.uid, video.id);
    } else {
      setWatchLaterAdded(true);
      await addToWatchLater(user.uid, {
        id: video.id,
        title: video.title,
        channel: video.channel,
        thumbnail: video.thumbnail,
        views: video.views,
        duration: video.duration,
      });
    }
  };

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", fontFamily: "Roboto, Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", backgroundColor: headerBg,
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        borderBottom: `1px solid ${borderColor}`, height: "56px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
            <span style={{ color: textColor, fontSize: "18px", fontWeight: "bold" }}>YourTube</span>
            <span style={{ color: subColor, fontSize: "10px", marginTop: "8px" }}>IN</span>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/history" style={{ color: subColor, textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>🕒 History</Link>
          <Link href="/liked" style={{ color: subColor, textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>👍 Liked</Link>
          <Link href="/watch-later" style={{ color: subColor, textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>⏰ Watch Later</Link>
          <Link href="/plans" style={{ color: "#ffd700", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>⭐ Plans</Link>
          <Link href="/call" style={{ color: "#4CAF50", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>📹 Call</Link>
          <SignInButton />
        </div>
      </div>

      {/* Theme bar */}
      <div style={{ textAlign: "center", padding: "4px", backgroundColor: isLight ? "#fff8e1" : "#1a1a1a", color: subColor, fontSize: "11px", marginTop: "56px" }}>
        {isLight ? "☀️ Light theme (South India + 10AM-12AM IST)" : "🌙 Dark theme active"}
      </div>

      {/* Main Layout */}
      <div style={{ display: "flex", gap: "24px", padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Left: Video + Info */}
        <div style={{ flex: 1, minWidth: 0 }}>

          <GesturePlayer
            videoUrl={video.videoUrl}
            videoId={video.id}
            onOpenComments={() => {
              setShowComments(true);
              setTimeout(() => document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" }), 100);
            }}
          />

          <h1 style={{ color: textColor, fontSize: "20px", fontWeight: "bold", margin: "12px 0 8px 0" }}>
            {video.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: "#ff0000", display: "flex", alignItems: "center",
                justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "16px"
              }}>
                {video.channel[0]}
              </div>
              <div>
                <p style={{ color: textColor, margin: 0, fontWeight: "bold", fontSize: "15px" }}>{video.channel}</p>
                <p style={{ color: subColor, margin: 0, fontSize: "12px" }}>1.2M subscribers</p>
              </div>
              <button
                onClick={handleSubscribe}
                style={{
                  padding: "8px 16px", borderRadius: "20px", border: "none",
                  cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                  backgroundColor: subscribed ? cardBg : textColor,
                  color: subscribed ? textColor : bg,
                }}
              >
                {subscribed ? "Subscribed ✓" : "Subscribe"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={handleVideoLike}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "20px 0 0 20px",
                  border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
                  backgroundColor: videoLiked ? "#065fd4" : cardBg,
                  color: videoLiked ? "#fff" : textColor,
                }}
              >
                👍 {videoLikes.toLocaleString()}
              </button>

              <button
                onClick={handleVideoDislike}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "0 20px 20px 0",
                  border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
                  backgroundColor: videoDisliked ? "#ff0000" : cardBg,
                  color: videoDisliked ? "#fff" : textColor,
                  marginLeft: "2px",
                }}
              >
                👎 {videoDisliked ? "Disliked" : "Dislike"}
              </button>

              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "14px", backgroundColor: cardBg, color: textColor }}
              >
                🔗 Share
              </button>

              <button
                onClick={handleWatchLater}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "20px", border: "none",
                  cursor: "pointer", fontSize: "14px",
                  backgroundColor: watchLaterAdded ? "#065fd4" : cardBg,
                  color: watchLaterAdded ? "#fff" : textColor,
                }}
              >
                {watchLaterAdded ? "✓ Saved" : "⏰ Watch Later"}
              </button>

              {!video.isUploaded && (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "14px", backgroundColor: cardBg, color: textColor }}
                  >
                    ⬇️ {downloading ? "..." : "Download"}
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "14px", backgroundColor: "#ffd700", color: "#000", fontWeight: "bold" }}
                  >
                    ⭐ Premium
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: cardBg, borderRadius: "12px", padding: "12px 16px", marginBottom: "24px" }}>
            <p style={{ color: textColor, margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold" }}>
              {(video.views / 1000).toFixed(0)}K views
            </p>
            <p style={{ color: textColor, margin: 0, fontSize: "14px" }}>
              {showDescription ? video.description : (video.description || "").slice(0, 100) + "..."}
            </p>
            <button
              onClick={() => setShowDescription(!showDescription)}
              style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontWeight: "bold", fontSize: "14px", padding: "4px 0" }}
            >
              {showDescription ? "Show less" : "Show more"}
            </button>
          </div>

          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: textColor, fontSize: "14px" }}>🌐 Translate comments:</span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                padding: "6px 10px", fontSize: "14px", borderRadius: "8px",
                backgroundColor: cardBg, color: textColor,
                border: `1px solid ${borderColor}`
              }}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div id="comments-section">
            <h3 style={{ color: textColor, marginBottom: "16px", fontSize: "16px" }}>
              {comments.length} Comments
            </h3>

            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: user ? "#ff0000" : "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: "bold", fontSize: "16px", flexShrink: 0
              }}>
                {user ? (user.displayName?.[0] || "U") : "?"}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    width: "100%", padding: "8px 0", fontSize: "14px",
                    border: "none", borderBottom: `2px solid ${borderColor}`,
                    backgroundColor: "transparent", color: textColor,
                    outline: "none", boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                  <button onClick={() => setComment("")} style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: "transparent", color: textColor, fontSize: "14px" }}>
                    Cancel
                  </button>
                  <button onClick={handleComment} style={{ padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", backgroundColor: "#065fd4", color: "#fff", fontSize: "14px", fontWeight: "bold" }}>
                    Comment
                  </button>
                </div>
              </div>
            </div>

            {comments.map((c, i) => (
              <div key={c.id} style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  backgroundColor: "#ff0000", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "#fff", fontWeight: "bold",
                  fontSize: "16px", flexShrink: 0
                }}>
                  {c.user[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ color: textColor, fontWeight: "bold", fontSize: "13px" }}>@{c.user}</span>
                    <span style={{ color: subColor, fontSize: "12px" }}>📍 {c.city}</span>
                  </div>
                  <p style={{ color: textColor, margin: "0 0 8px 0", fontSize: "14px" }}>{c.text}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => handleLike(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: c.likedBy.includes(userId) ? "#065fd4" : subColor, fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      👍 {c.likes}
                    </button>
                    <button
                      onClick={() => handleDislike(i)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: c.dislikedBy.includes(userId) ? "#ff0000" : subColor, fontSize: "13px" }}
                    >
                      👎 {c.dislikes}
                    </button>
                    <button
                      onClick={() => translateComment(i, c.originalText, selectedLang)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: subColor, fontSize: "13px" }}
                    >
                      🌐 Translate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Related Videos */}
        <div style={{ width: "360px", flexShrink: 0 }}>
          <h3 style={{ color: textColor, fontSize: "16px", marginBottom: "12px" }}>Related Videos</h3>
          {relatedVideos.map((v) => (
            <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", cursor: "pointer" }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    style={{ width: "168px", height: "94px", objectFit: "cover", borderRadius: "8px" }}
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/168x94?text=Video")}
                  />
                  <span style={{
                    position: "absolute", bottom: "4px", right: "4px",
                    backgroundColor: "rgba(0,0,0,0.8)", color: "#fff",
                    fontSize: "11px", padding: "2px 4px", borderRadius: "3px"
                  }}>
                    {v.duration}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: textColor, margin: "0 0 4px 0", fontSize: "13px", fontWeight: "bold", lineHeight: "1.3" }}>
                    {v.title}
                  </p>
                  <p style={{ color: subColor, margin: "0 0 2px 0", fontSize: "12px" }}>{v.channel}</p>
                  <p style={{ color: subColor, margin: 0, fontSize: "12px" }}>{(v.views / 1000).toFixed(0)}K views</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}