"use client";

import { videos as staticVideos } from "@/lib/videos";
import { getAllUploadedVideos, UploadedVideo } from "@/lib/uploadedVideos";
import SignInButton from "@/components/SignInButton";
import Link from "next/link";
import { useTheme } from "@/lib/useTheme";
import { useState, useEffect, useRef } from "react";
import { Home as HomeIcon, PlaySquare, History, ThumbsUp, Clock, User, Search, Mic } from "lucide-react";

const categories = ["All", "Music", "Gaming", "News", "Live", "Cooking", "Travel", "Food", "Sports", "Tech"];

const sidebarItems = [
  { icon: HomeIcon, label: "Home", href: "/" },
  { icon: PlaySquare, label: "Subscriptions", href: "/subscriptions" },
  { icon: History, label: "History", href: "/history" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked" },
  { icon: Clock, label: "Watch later", href: "/watch-later" },
  { icon: User, label: "You", href: "/profile" },
];

interface FeedVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  views: number;
  duration: string;
}

export default function Home() {
  const { isLight } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleVoiceSearch = () => {
    // Second click while listening = stop
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search isn't supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSearchQuery(transcript);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        alert("Microphone access is blocked. Click the lock icon in the address bar, allow the microphone, then try again.");
      } else if (event.error === "no-speech") {
        alert("I didn't hear anything. Please try again.");
      } else if (event.error !== "aborted") {
        alert("Voice search error: " + event.error);
      }
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    getAllUploadedVideos().then(setUploadedVideos);
  }, []);

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#ffffff" : "#212121";
  const sidebarBg = isLight ? "#ffffff" : "#0f0f0f";
  const cardBg = isLight ? "#f9f9f9" : "#212121";
  const textColor = isLight ? "#000" : "#fff";
  const subColor = isLight ? "#555" : "#aaa";
  const borderColor = isLight ? "#e0e0e0" : "#333";
  const hoverBg = isLight ? "#f0f0f0" : "#272727";

  const allVideos: FeedVideo[] = [
    ...uploadedVideos.map((v) => ({
      id: v.id, title: v.title, channel: v.channel, thumbnail: v.thumbnail, views: v.views, duration: v.duration,
    })),
    ...staticVideos,
  ];

  const filteredVideos = allVideos.filter(v =>
    searchQuery === "" ||
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.channel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", fontFamily: "Roboto, Arial, sans-serif" }}>

      {/* Top Navbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", backgroundColor: headerBg,
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        borderBottom: `1px solid ${borderColor}`, height: "56px"
      }}>
        {/* Left: Hamburger + Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: textColor, padding: "8px" }}
          >
            ☰
          </button>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
            <span style={{ color: textColor, fontSize: "18px", fontWeight: "bold" }}>YourTube</span>
            <span style={{ color: subColor, fontSize: "10px", marginTop: "8px" }}>IN</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, maxWidth: "600px", margin: "0 40px" }}>
          <div style={{
            display: "flex", flex: 1, border: `1px solid ${borderColor}`,
            borderRadius: "40px 0 0 40px", overflow: "hidden"
          }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={listening ? "Listening..." : "Search"}
              style={{
                flex: 1, height: "40px", padding: "0 16px", border: "none", outline: "none",
                backgroundColor: isLight ? "#fff" : "#121212",
                color: textColor, fontSize: "15px"
              }}
            />
          </div>
          <button
            type="button"
            aria-label="Search"
            style={{
              width: "64px", height: "42px", backgroundColor: isLight ? "#f8f8f8" : "#222",
              borderTop: `1px solid ${borderColor}`,
              borderRight: `1px solid ${borderColor}`,
              borderBottom: `1px solid ${borderColor}`,
              borderLeft: "none",
              borderRadius: "0 40px 40px 0", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Search size={20} color={textColor} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={listening ? "Stop listening" : "Search with your voice"}
            title={listening ? "Listening... click to stop" : "Search with your voice"}
            onClick={handleVoiceSearch}
            style={{
              marginLeft: "12px", width: "40px", height: "40px", flexShrink: 0,
              borderRadius: "50%", border: "none", cursor: "pointer",
              backgroundColor: listening ? "#ff0000" : (isLight ? "#f2f2f2" : "#272727"),
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Mic size={20} color={listening ? "#fff" : textColor} strokeWidth={1.75} />
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/call" style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", backgroundColor: isLight ? "#f2f2f2" : "#272727",
            borderRadius: "20px", textDecoration: "none", color: "#4CAF50", fontSize: "14px", fontWeight: "bold"
          }}>
            📞 Call
          </Link>
          <Link href="/plans" style={{
            display: "flex", alignItems: "center",
            padding: "6px 12px", backgroundColor: isLight ? "#f2f2f2" : "#272727",
            borderRadius: "20px", textDecoration: "none", color: "#ffd700", fontSize: "14px", fontWeight: "bold"
          }}>
            ⭐ Plans
          </Link>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: textColor }}>
            🔔
          </button>
          <SignInButton />
        </div>
      </div>

      {/* Body: Sidebar + Content */}
      <div style={{ display: "flex", paddingTop: "56px" }}>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: "240px", minHeight: "calc(100vh - 56px)",
            backgroundColor: sidebarBg, padding: "12px 0",
            position: "fixed", top: "56px", left: 0, bottom: 0,
            overflowY: "auto", zIndex: 100,
            borderRight: `1px solid ${borderColor}`
          }}>
            {sidebarItems.map((item) => (
              <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "24px",
                  padding: "10px 24px", cursor: "pointer", color: textColor,
                  fontSize: "14px", borderRadius: "10px", margin: "2px 8px",
                  backgroundColor: item.label === "Home" ? hoverBg : "transparent"
                }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = hoverBg)}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = item.label === "Home" ? hoverBg : "transparent")}
                >
                  <item.icon size={22} color={textColor} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}

            <div style={{ borderTop: `1px solid ${borderColor}`, margin: "12px 0" }} />

            {/* Theme indicator */}
            <div style={{ padding: "10px 24px", color: subColor, fontSize: "12px" }}>
              {isLight ? "☀️ Light theme (South India)" : "🌙 Dark theme active"}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1, marginLeft: sidebarOpen ? "240px" : "0", padding: "0" }}>

          {/* Category tabs */}
          <div style={{
            display: "flex", gap: "8px", padding: "12px 24px",
            overflowX: "auto", position: "sticky", top: "56px",
            backgroundColor: bg, zIndex: 50,
            borderBottom: `1px solid ${borderColor}`
          }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none",
                  cursor: "pointer", whiteSpace: "nowrap", fontSize: "14px",
                  fontWeight: selectedCategory === cat ? "bold" : "normal",
                  backgroundColor: selectedCategory === cat
                    ? (isLight ? "#000" : "#fff")
                    : (isLight ? "#f2f2f2" : "#272727"),
                  color: selectedCategory === cat
                    ? (isLight ? "#fff" : "#000")
                    : textColor,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Video Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px", padding: "24px"
          }}>
            {filteredVideos.map((video) => (
              <Link key={video.id} href={`/video/${video.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{ cursor: "pointer" }}
                  onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                >
                  {/* Thumbnail */}
                  <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", backgroundColor: cardBg }}>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300x180?text=Video")}
                    />
                    <span style={{
                      position: "absolute", bottom: "6px", right: "6px",
                      backgroundColor: "rgba(0,0,0,0.8)", color: "#fff",
                      fontSize: "12px", padding: "2px 6px", borderRadius: "4px"
                    }}>
                      {video.duration}
                    </span>
                  </div>

                  {/* Video info */}
                  <div style={{ display: "flex", gap: "12px", padding: "12px 0" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      backgroundColor: "#ff0000", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: "bold", fontSize: "14px"
                    }}>
                      {video.channel[0]}
                    </div>
                    <div>
                      <p style={{ color: textColor, margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", lineHeight: "1.3" }}>
                        {video.title}
                      </p>
                      <p style={{ color: subColor, margin: "0 0 2px 0", fontSize: "13px" }}>
                        {video.channel}
                      </p>
                      <p style={{ color: subColor, margin: 0, fontSize: "12px" }}>
                        {(video.views / 1000).toFixed(1)}K views
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}