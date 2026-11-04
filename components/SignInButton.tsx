"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { getChannelByOwner } from "@/lib/channels";
import CreateChannelDialog from "@/components/CreateChannelDialog";
import Link from "next/link";

export default function SignInButton() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasChannel, setHasChannel] = useState(false);
  const [checkingChannel, setCheckingChannel] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getChannelByOwner(user.uid).then((channel) => {
      setHasChannel(!!channel);
      setCheckingChannel(false);
    });
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <p style={{ color: "#fff" }}>Loading...</p>;

  if (user) {
    return (
      <div style={{ position: "relative" }} ref={menuRef}>
        <img
          src={user.photoURL ?? ""}
          alt={user.displayName ?? "User"}
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer" }}
        />

        {menuOpen && (
          <div style={{
            position: "absolute", top: "44px", right: 0,
            backgroundColor: "#282828", borderRadius: "8px",
            minWidth: "180px", boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            overflow: "hidden", zIndex: 300
          }}>
            {!checkingChannel && (
              hasChannel ? (
                <Link
                  href={`/channel/${user.uid}`}
                  onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "12px 16px", color: "#fff", textDecoration: "none", fontSize: "14px" }}
                >
                  Your channel
                </Link>
              ) : (
                <button
                  onClick={() => { setShowCreateDialog(true); setMenuOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "12px 16px", color: "#fff", background: "none",
                    border: "none", cursor: "pointer", fontSize: "14px"
                  }}
                >
                  Create Channel
                </button>
              )
            )}
            <Link href="/history" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 16px", color: "#fff", textDecoration: "none", fontSize: "14px" }}>
              History
            </Link>
            <Link href="/liked" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 16px", color: "#fff", textDecoration: "none", fontSize: "14px" }}>
              Liked videos
            </Link>
            <Link href="/watch-later" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 16px", color: "#fff", textDecoration: "none", fontSize: "14px" }}>
              Watch later
            </Link>
            <div style={{ borderTop: "1px solid #444" }} />
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "12px 16px", color: "#ff5555", background: "none",
                border: "none", cursor: "pointer", fontSize: "14px"
              }}
            >
              Sign out
            </button>
          </div>
        )}

        {showCreateDialog && (
          <CreateChannelDialog
            userId={user.uid}
            defaultName={user.displayName ?? ""}
            onClose={() => setShowCreateDialog(false)}
            onCreated={() => setHasChannel(true)}
          />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      style={{ padding: "8px 16px", backgroundColor: "#fff", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
    >
      Sign in with Google
    </button>
  );
}