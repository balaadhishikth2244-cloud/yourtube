"use client";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import SignInButton from "@/components/SignInButton";

const plans = [
  {
    id: "bronze",
    name: "Bronze",
    emoji: "🥉",
    price: 10,
    color: "#cd7f32",
    features: ["3 downloads/day", "HD quality", "Basic support"],
  },
  {
    id: "silver",
    name: "Silver",
    emoji: "🥈",
    price: 50,
    color: "#c0c0c0",
    features: ["10 downloads/day", "Full HD quality", "Priority support"],
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "🥇",
    price: 100,
    color: "#ffd700",
    features: ["Unlimited downloads", "4K quality", "24/7 Premium support"],
  },
];

export default function PlansPage() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleUpgrade = async (plan: (typeof plans)[0]) => {
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    setLoadingPlan(plan.id);

    // Load Razorpay checkout script if not already loaded
    if (!(window as any).Razorpay) {
      try {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay script"));
          document.body.appendChild(script);
        });
      } catch (err) {
        alert("Failed to load payment gateway. Please check your internet connection and try again.");
        setLoadingPlan(null);
        return;
      }
    }

    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: plan.price }),
    });
    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "YourTube",
      description: `${plan.name} Plan`,
      order_id: order.id,
      handler: async function (response: any) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          plan: plan.id,
          planActivatedAt: new Date(),
        }, { merge: true });

        await fetch("/api/send-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.displayName,
            plan: plan.id,
            amount: plan.price,
            orderId: response.razorpay_order_id,
          }),
        });

        alert(`🎉 ${plan.name} Plan activated! Invoice sent to ${user.email}`);
        setLoadingPlan(null);
      },
      prefill: { name: user.displayName, email: user.email },
      theme: { color: "#ff0000" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    setLoadingPlan(null);
  };

  return (
    <div style={{ backgroundColor: "#0f0f0f", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 24px", backgroundColor: "#212121", position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: "#ff0000", fontSize: "24px" }}>▶</span>
          <span style={{ color: "#fff", fontSize: "18px", fontWeight: "bold" }}>YourTube</span>
          <span style={{ color: "#aaa", fontSize: "10px", marginTop: "8px" }}>IN</span>
        </Link>
        <SignInButton />
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "8px", fontSize: "28px" }}>
          Choose Your Plan
        </h2>
        <p style={{ color: "#aaa", textAlign: "center", marginBottom: "40px" }}>
          Upgrade to unlock more downloads and premium features
        </p>

        {/* Free Plan */}
        <div style={{
          border: "1px solid #444", borderRadius: "12px", padding: "20px 24px",
          marginBottom: "24px", backgroundColor: "#1a1a1a",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ color: "#fff", margin: "0 0 6px 0" }}>Free Plan</h3>
            <p style={{ color: "#aaa", margin: 0, fontSize: "14px" }}>
              ✅ 1 download/day &nbsp;✅ Standard quality
            </p>
          </div>
          <span style={{
            padding: "6px 18px", borderRadius: "20px",
            backgroundColor: "#333", color: "#aaa", fontSize: "13px",
          }}>
            Default
          </span>
        </div>

        {/* Paid Plans Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{
              border: `2px solid ${plan.color}`,
              borderRadius: "12px", padding: "28px 24px",
              backgroundColor: "#1a1a1a", textAlign: "center",
            }}>
              <div style={{ fontSize: "44px", marginBottom: "8px" }}>{plan.emoji}</div>
              <h3 style={{ color: plan.color, margin: "0 0 4px 0", fontSize: "22px" }}>
                {plan.name}
              </h3>
              <p style={{ color: "#fff", fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
                ₹{plan.price}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 24px 0", textAlign: "left" }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ color: "#ccc", marginBottom: "10px", fontSize: "14px" }}>
                    ✅ {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={loadingPlan === plan.id}
                style={{
                  width: "100%", padding: "12px",
                  backgroundColor: plan.color, color: "#000",
                  border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "bold", fontSize: "15px",
                }}
              >
                {loadingPlan === plan.id ? "Processing..." : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}