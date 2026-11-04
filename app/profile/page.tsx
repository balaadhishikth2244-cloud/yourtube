"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import SignInButton from "@/components/SignInButton";
import { useTheme } from "@/lib/useTheme";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { isLight } = useTheme();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.data();
      setDownloads(data?.downloads || []);
      setPlan(data?.plan || "free");
    };
    fetchData();
  }, [user]);

  if (loading) return <div style={{ color: "#fff", padding: "40px" }}>Loading...</div>;
  if (!user) return (
    <div style={{ backgroundColor: "#0f0f0f", minHeight: "100vh", color: "#fff", padding: "40px", textAlign: "center" }}>
      <p>Please sign in to view your profile.</p>
      <SignInButton />
    </div>
  );

  const planColors: Record<string, string> = {
    free: "#333",
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    gold: "#ffd700",
    premium: "#ffd700",
  };

  const planLabels: Record<string, string> = {
    free: "Free Plan",
    bronze: "🥉 Bronze",
    silver: "🥈 Silver",
    gold: "🥇 Gold",
    premium: "⭐ Premium",
  };

  return (
    <div style={{ backgroundColor: isLight ? "#ffffff" : "#0f0f0f", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 24px", backgroundColor: isLight ? "#f0f0f0" : "#212121",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
          <span style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>YourTube</span>
          <span style={{ color: "#aaa", fontSize: "10px", marginTop: "8px" }}>IN</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/plans" style={{ color: "#ffd700", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
            ⭐ Plans
          </Link>
          <SignInButton />
        </div>
      </div>

      {/* Theme indicator */}
      <div style={{
        textAlign: "center", padding: "6px",
        backgroundColor: isLight ? "#fff8e1" : "#1a1a1a",
        color: isLight ? "#555" : "#aaa", fontSize: "12px"
      }}>
        {isLight ? "☀️ Light theme (South India + 10AM-12AM IST)" : "🌙 Dark theme active"}
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        {/* Profile Info */}
        <div style={{
          display: "flex", alignItems: "center", gap: "20px", marginBottom: "30px",
          backgroundColor: isLight ? "#f9f9f9" : "#212121",
          padding: "20px", borderRadius: "12px",
          border: isLight ? "1px solid #ddd" : "none"
        }}>
          <img
            src={user.photoURL || ""}
            alt={user.displayName || "User"}
            style={{ width: "80px", height: "80px", borderRadius: "50%" }}
          />
          <div>
            <h2 style={{ color: isLight ? "#000" : "#fff", margin: "0 0 6px 0" }}>
              {user.displayName}
            </h2>
            <p style={{ color: isLight ? "#555" : "#aaa", margin: "0 0 10px 0" }}>
              {user.email}
            </p>
            <span style={{
              padding: "6px 16px", borderRadius: "12px",
              backgroundColor: planColors[plan] || "#333",
              color: plan === "free" ? "#fff" : "#000",
              fontSize: "13px", fontWeight: "bold"
            }}>
              {planLabels[plan] || "Free Plan"}
            </span>
            <Link href="/plans" style={{
              marginLeft: "12px", padding: "6px 16px", borderRadius: "12px",
              backgroundColor: "#ff0000", color: "#fff",
              fontSize: "13px", textDecoration: "none", fontWeight: "bold"
            }}>
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* Downloads Section */}
        <h3 style={{ color: isLight ? "#000" : "#fff", marginBottom: "16px" }}>
          ⬇️ Downloaded Videos
        </h3>

        {downloads.length === 0 ? (
          <div style={{
            backgroundColor: isLight ? "#f9f9f9" : "#212121",
            borderRadius: "12px", padding: "40px", textAlign: "center",
            border: isLight ? "1px solid #ddd" : "none"
          }}>
            <p style={{ color: isLight ? "#555" : "#aaa", margin: 0 }}>
              No downloads yet. Go download a video!
            </p>
            <Link href="/" style={{
              display: "inline-block", marginTop: "16px",
              padding: "10px 24px", backgroundColor: "#ff0000",
              color: "#fff", borderRadius: "8px", textDecoration: "none"
            }}>
              Browse Videos
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            {[...downloads].reverse().map((d, i) => (
              <Link key={i} href={`/video/${d.videoId}`} style={{ textDecoration: "none" }}>
                <div style={{
                  backgroundColor: isLight ? "#f9f9f9" : "#212121",
                  borderRadius: "8px", overflow: "hidden", cursor: "pointer",
                  border: isLight ? "1px solid #ddd" : "none",
                  transition: "transform 0.2s"
                }}
                  onMouseOver={e => (e.currentTarget.style.transform = "scale(1.02)")}
                  onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <img
                    src={d.thumbnail}
                    alt={d.title}
                    style={{ width: "100%", height: "140px", objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/250x140?text=Video")}
                  />
                  <div style={{ padding: "10px" }}>
                    <p style={{ color: isLight ? "#000" : "#fff", margin: "0 0 4px 0", fontSize: "14px" }}>
                      {d.title}
                    </p>
                    <p style={{ color: isLight ? "#555" : "#aaa", margin: 0, fontSize: "12px" }}>
                      📅 {new Date(d.downloadedAt).toLocaleDateString()}
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