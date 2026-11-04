"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChannel } from "@/lib/channels";

interface Props {
  userId: string;
  defaultName?: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateChannelDialog({ userId, defaultName, onClose, onCreated }: Props) {
  const [name, setName] = useState(defaultName || "");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Please enter a channel name.");
      return;
    }
    setCreating(true);
    try {
      await createChannel(userId, name.trim(), description.trim());
      onCreated();
      onClose();
      router.push(`/channel/${userId}`);
    } catch (err) {
      alert("Failed to create channel. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#181818", borderRadius: "12px", padding: "24px",
          width: "420px", maxWidth: "90vw", border: "1px solid #333"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#fff", margin: 0, fontSize: "18px" }}>Create your channel</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#aaa", fontSize: "18px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "6px" }}>
          Channel Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bala's Tech Channel"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "8px",
            border: "1px solid #444", backgroundColor: "#0f0f0f", color: "#fff",
            fontSize: "14px", marginBottom: "16px", boxSizing: "border-box"
          }}
        />

        <label style={{ color: "#aaa", fontSize: "13px", display: "block", marginBottom: "6px" }}>
          Channel Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell viewers about your channel..."
          rows={4}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "8px",
            border: "1px solid #444", backgroundColor: "#0f0f0f", color: "#fff",
            fontSize: "14px", marginBottom: "20px", boxSizing: "border-box", resize: "vertical"
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px", borderRadius: "8px", border: "none",
              backgroundColor: "#333", color: "#fff", cursor: "pointer", fontSize: "14px"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: "10px 18px", borderRadius: "8px", border: "none",
              backgroundColor: "#ff0000", color: "#fff", cursor: "pointer",
              fontSize: "14px", fontWeight: "bold"
            }}
          >
            {creating ? "Creating..." : "Create channel"}
          </button>
        </div>
      </div>
    </div>
  );
}