"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SignInButton from "@/components/SignInButton";
import { useTheme } from "@/lib/useTheme";

export default function CallPage() {
  const { isLight } = useTheme();
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [status, setStatus] = useState("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initPeer = async () => {
      const { Peer } = await import("peerjs");
      const peer = new Peer();
      peerRef.current = peer;

      peer.on("open", (id) => {
        setPeerId(id);
      });

      peer.on("call", async (call) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          call.answer(stream);
        } catch {
          // Answer without video if no camera
          call.answer(new MediaStream());
          setCameraError("No camera found — joining without video.");
        }
        callRef.current = call;
        setStatus("in-call");
        call.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        });
      });
    };

    initPeer();

    return () => {
      peerRef.current?.destroy();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCall = async () => {
    if (!remotePeerId.trim()) { alert("Enter a Peer ID to call!"); return; }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch {
      setCameraError("No camera found — calling without video.");
      stream = new MediaStream();
    }

    const call = peerRef.current.call(remotePeerId, stream);
    callRef.current = call;
    setStatus("calling");

    call.on("stream", (remoteStream: MediaStream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      setStatus("in-call");
    });

    call.on("close", () => setStatus("idle"));
  };

  const endCall = () => {
    callRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setStatus("idle");
    setIsRecording(false);
    setIsScreenSharing(false);
    setCameraError("");
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = (callRef.current?.peerConnection as RTCPeerConnection)
        ?.getSenders()
        ?.find((s: RTCRtpSender) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
      setIsScreenSharing(true);
      videoTrack.onended = () => {
        setIsScreenSharing(false);
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    } catch {
      alert("Screen sharing cancelled or not supported.");
    }
  };

  const startRecording = () => {
    const stream = remoteVideoRef.current?.srcObject as MediaStream;
    if (!stream) { alert("No call in progress to record."); return; }
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const bg = isLight ? "#ffffff" : "#0f0f0f";
  const headerBg = isLight ? "#f0f0f0" : "#212121";
  const cardBg = isLight ? "#f9f9f9" : "#212121";
  const textColor = isLight ? "#000" : "#fff";
  const subColor = isLight ? "#555" : "#aaa";

  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 24px", backgroundColor: headerBg,
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

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <h2 style={{ color: textColor, marginBottom: "8px" }}>📹 Video Call</h2>
        <p style={{ color: subColor, marginBottom: "24px" }}>
          Make video calls, share your screen, and record sessions with friends.
        </p>

        {/* Camera error warning */}
        {cameraError && (
          <div style={{
            backgroundColor: "#ff980020", border: "1px solid #ff9800",
            borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#ff9800"
          }}>
            ⚠️ {cameraError}
          </div>
        )}

        {/* Your Peer ID */}
        <div style={{ backgroundColor: cardBg, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ color: subColor, margin: "0 0 6px 0", fontSize: "13px" }}>
            Your Peer ID (share this with friends):
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <code style={{
              color: "#ff0000", fontSize: "15px", fontWeight: "bold",
              backgroundColor: isLight ? "#fff" : "#333",
              padding: "8px 12px", borderRadius: "6px", flex: 1
            }}>
              {peerId || "Generating..."}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(peerId); alert("Peer ID copied!"); }}
              style={{ padding: "8px 14px", backgroundColor: "#333", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Call Controls */}
        {status === "idle" && (
          <div style={{ backgroundColor: cardBg, borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ color: textColor, margin: "0 0 10px 0", fontWeight: "bold" }}>Call a Friend</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="Enter friend's Peer ID..."
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  border: isLight ? "1px solid #ccc" : "1px solid #444",
                  backgroundColor: isLight ? "#fff" : "#333",
                  color: textColor, fontSize: "14px"
                }}
              />
              <button
                onClick={startCall}
                style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
              >
                📞 Call
              </button>
            </div>
          </div>
        )}

        {status === "calling" && (
          <div style={{ textAlign: "center", padding: "20px", color: textColor }}>
            <p>📞 Calling... waiting for answer</p>
            <button onClick={endCall} style={{ padding: "10px 20px", backgroundColor: "#ff0000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              ❌ Cancel
            </button>
          </div>
        )}

        {/* Video Feeds */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <p style={{ color: subColor, fontSize: "13px", marginBottom: "6px" }}>You</p>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", borderRadius: "12px", backgroundColor: "#000", minHeight: "180px" }}
            />
          </div>
          <div>
            <p style={{ color: subColor, fontSize: "13px", marginBottom: "6px" }}>Friend</p>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: "12px", backgroundColor: "#000", minHeight: "180px" }}
            />
          </div>
        </div>

        {/* In-call controls */}
        {status === "in-call" && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            <button
              onClick={isScreenSharing ? () => setIsScreenSharing(false) : startScreenShare}
              style={{
                padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                backgroundColor: isScreenSharing ? "#ffd700" : "#333",
                color: isScreenSharing ? "#000" : "#fff"
              }}
            >
              {isScreenSharing ? "🖥️ Stop Sharing" : "🖥️ Share Screen"}
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                backgroundColor: isRecording ? "#ff0000" : "#333", color: "#fff"
              }}
            >
              {isRecording ? "⏹️ Stop Recording" : "⏺️ Record Call"}
            </button>
            <button
              onClick={endCall}
              style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: "#ff0000", color: "#fff" }}
            >
              📵 End Call
            </button>
          </div>
        )}

        {/* Instructions */}
        <div style={{ backgroundColor: cardBg, borderRadius: "12px", padding: "16px" }}>
          <h4 style={{ color: textColor, margin: "0 0 12px 0" }}>How to use:</h4>
          <ol style={{ color: subColor, paddingLeft: "20px", margin: 0, lineHeight: "2" }}>
            <li>Share your <strong style={{ color: textColor }}>Peer ID</strong> with your friend</li>
            <li>Ask them to open <code style={{ color: "#ff0000" }}>localhost:3000/call</code></li>
            <li>Enter their Peer ID and click <strong style={{ color: textColor }}>Call</strong></li>
            <li>During the call, click <strong style={{ color: textColor }}>Share Screen</strong> to share YouTube</li>
            <li>Click <strong style={{ color: textColor }}>Record Call</strong> to record and save the session</li>
          </ol>
        </div>
      </div>
    </div>
  );
}