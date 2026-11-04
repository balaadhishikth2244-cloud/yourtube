"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getChannelById, ChannelData } from "@/lib/channels";
import { useTheme } from "@/lib/useTheme";
import { useAuth } from "@/lib/useAuth";
import SignInButton from "@/components/SignInButton";
import { uploadVideo, getUploadedVideosByChannel, UploadedVideo } from "@/lib/uploadedVideos";
import { subscribeToChannel, unsubscribeFromChannel, isSubscribedTo, getSubscriberCount } from "@/lib/subscriptions";

const tabs = ["Home", "Videos", "Shorts", "Playlists", "Community", "About"];

export default function ChannelPage() {
  const { id } = useParams();
  const channelId = Array.isArray(id) ? id[0] : id;
  const { isLight } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Home");
  const [dragOver, setDragOver] = useState(false);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelVideos, setChannelVideos] = useState<UploadedVideo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.uid === channelId;

  useEffect(() => {
    if (!channelId) return;
    getChannelById(channelId).then((c) => {
      setChannel(c);
      setLoading(false);
    });
  }, [channelId]);

  const loadVideos = () => {
    if (!channelId) return;
    getUploadedVideosByChannel(channelId).then(setChannelVideos);
  };

  useEffect(() => {
    loadVideos();
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return;
    getSubscriberCount(channelId).then(setSubscriberCount);
    if (user && !isOwner) {
      isSubscribedTo(user.uid, channelId).then(setSubscribed);
    }
  }, [channelId, user, isOwner]);

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#ffffff" : "#212121";
  const textColor = isLight ? "#000" : "#fff";
  const subColor = isLight ? "#555" : "#aaa";
  const cardBg = isLight ? "#f2f2f2" : "#272727";
  const borderColor = isLight ? "#e0e0e0" : "#333";
  const dropzoneBg = dragOver ? (isLight ? "#f0f7ff" : "#1a2733") : "transparent";
  const dropzoneBorder = dragOver ? "#065fd4" : borderColor;

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || !user || !channel) return;
    const file = files[0];

    if (file.size > 100 * 1024 * 1024) {
      alert("File too large. Max size is 100MB.");
      return;
    }

    setPendingFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    setUploadDescription("");
  };

  const confirmUpload = async () => {
    if (!pendingFile || !user || !channel || !uploadTitle.trim()) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadVideo(user.uid, channel.name, pendingFile, uploadTitle.trim(), uploadDescription.trim(), setUploadProgress);
      alert("Video uploaded successfully!");
      loadVideos();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setPendingFile(null);
    }
  };

  const handleSubscribe = async () => {
    if (!user) { alert("Please sign in to subscribe."); return; }
    if (!channel || !channelId) return;
    if (subscribed) {
      setSubscribed(false);
      setSubscriberCount((c) => Math.max(0, c - 1));
      await unsubscribeFromChannel(user.uid, channelId);
    } else {
      setSubscribed(true);
      setSubscriberCount((c) => c + 1);
      await subscribeToChannel(user.uid, channelId, channel.name);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: bg, minHeight: "100vh", padding: "40px", color: textColor }}>
        Loading channel...
      </div>
    );
  }

  if (!channel) {
    return (
      <div style={{ backgroundColor: bg, minHeight: "100vh", padding: "40px", color: textColor, textAlign: "center" }}>
        <p>This channel doesn't exist yet.</p>
        {isOwner && <p style={{ color: subColor, fontSize: "14px" }}>Use the "Create Channel" option in your account menu to set one up.</p>}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", fontFamily: "Roboto, Arial, sans-serif" }}>

      {/* Header */}
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

      {/* Channel banner */}
      <div style={{
        height: "12px",
        background: "linear-gradient(90deg, #6b21a8, #db2777, #f59e0b)",
        marginTop: "56px"
      }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>

        {/* Channel header */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "16px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            backgroundColor: "#ff0000", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "32px",
            flexShrink: 0
          }}>
            {channel.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ color: textColor, fontSize: "28px", fontWeight: "bold", margin: "0 0 4px 0" }}>
              {channel.name}
            </h1>
            <p style={{ color: subColor, margin: "0 0 6px 0", fontSize: "14px" }}>
              {channel.handle} · {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
            </p>
            {channel.description && (
              <p style={{ color: textColor, margin: "0 0 8px 0", fontSize: "14px" }}>
                {channel.description}
              </p>
            )}
            {!isOwner && (
              <button
                onClick={handleSubscribe}
                style={{
                  marginTop: "4px", padding: "8px 20px", borderRadius: "20px", border: "none",
                  cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                  backgroundColor: subscribed ? cardBg : textColor,
                  color: subscribed ? textColor : bg,
                }}
              >
                {subscribed ? "Subscribed ✓" : "Subscribe"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "24px", borderBottom: `1px solid ${borderColor}`, marginBottom: "24px" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "12px 4px", fontSize: "14px", fontWeight: "bold",
                color: activeTab === tab ? textColor : subColor,
                borderBottom: activeTab === tab ? `2px solid ${textColor}` : "2px solid transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Home tab */}
        {activeTab === "Home" && (
          <>
            {isOwner && (
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ color: textColor, fontSize: "18px", marginBottom: "16px" }}>Upload a video</h2>
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!uploading) handleFileSelect(e.dataTransfer.files);
                  }}
                  style={{
                    border: `2px dashed ${dropzoneBorder}`, borderRadius: "12px",
                    padding: "48px 24px", textAlign: "center", cursor: uploading ? "default" : "pointer",
                    backgroundColor: dropzoneBg, transition: "background-color 0.15s, border-color 0.15s"
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>⬆️</div>
                  <p style={{ color: textColor, fontWeight: "bold", margin: "0 0 4px 0", fontSize: "15px" }}>
                    Drag and drop video files to upload
                  </p>
                  <p style={{ color: subColor, margin: "0 0 8px 0", fontSize: "13px" }}>
                    or click to select files
                  </p>
                  <p style={{ color: subColor, margin: 0, fontSize: "12px" }}>
                    MP4, WebM, MOV or AVI · Up to 100MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/avi"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              </div>
            )}

            <h2 style={{ color: textColor, fontSize: "18px", marginBottom: "16px" }}>Videos</h2>
            <UploadedVideoGrid videos={channelVideos} textColor={textColor} subColor={subColor} cardBg={cardBg} />
          </>
        )}

        {/* Videos tab */}
        {activeTab === "Videos" && (
          <UploadedVideoGrid videos={channelVideos} textColor={textColor} subColor={subColor} cardBg={cardBg} />
        )}

        {/* Static tabs */}
        {activeTab === "Shorts" && (
          <p style={{ color: subColor, fontSize: "14px" }}>This channel hasn't posted any Shorts yet.</p>
        )}
        {activeTab === "Playlists" && (
          <p style={{ color: subColor, fontSize: "14px" }}>No playlists yet.</p>
        )}
        {activeTab === "Community" && (
          <p style={{ color: subColor, fontSize: "14px" }}>No community posts yet.</p>
        )}
        {activeTab === "About" && (
          <div style={{ maxWidth: "600px" }}>
            <p style={{ color: textColor, fontSize: "14px", marginBottom: "12px" }}>
              {channel.description || "No description yet."}
            </p>
            <p style={{ color: subColor, fontSize: "13px" }}>{channel.handle}</p>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {pendingFile && (
        <div
          onClick={() => !uploading && setPendingFile(null)}
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isLight ? "#fff" : "#181818", borderRadius: "12px", padding: "24px",
              width: "420px", maxWidth: "90vw", border: `1px solid ${borderColor}`
            }}
          >
            <h2 style={{ color: textColor, margin: "0 0 20px 0", fontSize: "18px" }}>Upload video</h2>

            <label style={{ color: subColor, fontSize: "13px", display: "block", marginBottom: "6px" }}>
              Title
            </label>
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              disabled={uploading}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: `1px solid ${borderColor}`, backgroundColor: isLight ? "#f9f9f9" : "#0f0f0f",
                color: textColor, fontSize: "14px", marginBottom: "16px", boxSizing: "border-box"
              }}
            />

            <label style={{ color: subColor, fontSize: "13px", display: "block", marginBottom: "6px" }}>
              Description (optional)
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              disabled={uploading}
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: `1px solid ${borderColor}`, backgroundColor: isLight ? "#f9f9f9" : "#0f0f0f",
                color: textColor, fontSize: "14px", marginBottom: "20px", boxSizing: "border-box", resize: "vertical"
              }}
            />

            {uploading && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ color: textColor, fontSize: "13px", marginBottom: "8px" }}>Uploading... {uploadProgress}%</p>
                <div style={{ width: "100%", height: "8px", backgroundColor: borderColor, borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${uploadProgress}%`, height: "100%", backgroundColor: "#065fd4", transition: "width 0.2s" }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setPendingFile(null)}
                disabled={uploading}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: cardBg, color: textColor, cursor: "pointer", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading || !uploadTitle.trim()}
                style={{ padding: "10px 18px", borderRadius: "8px", border: "none", backgroundColor: "#ff0000", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadedVideoGrid({ videos, textColor, subColor, cardBg }: {
  videos: UploadedVideo[];
  textColor: string;
  subColor: string;
  cardBg: string;
}) {
  if (videos.length === 0) {
    return <p style={{ color: subColor, fontSize: "14px" }}>No videos uploaded yet.</p>;
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: "16px"
    }}>
      {videos.map((v) => (
        <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: "none" }}>
          <div style={{ cursor: "pointer" }}>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", backgroundColor: cardBg }}>
              <img
                src={v.thumbnail}
                alt={v.title}
                style={{ width: "100%", height: "130px", objectFit: "cover", display: "block" }}
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/220x130?text=Video")}
              />
              <span style={{
                position: "absolute", bottom: "6px", right: "6px",
                backgroundColor: "rgba(0,0,0,0.8)", color: "#fff",
                fontSize: "12px", padding: "2px 6px", borderRadius: "4px"
              }}>
                {v.duration}
              </span>
            </div>
            <p style={{ color: textColor, margin: "8px 0 4px 0", fontSize: "14px", fontWeight: "bold" }}>
              {v.title}
            </p>
            <p style={{ color: subColor, margin: 0, fontSize: "12px" }}>
              {(v.views / 1000).toFixed(1)}K views
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}