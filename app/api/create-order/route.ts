import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { amount } = await req.json();

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: "plan_upgrade_" + Date.now(),
  });

  return NextResponse.json(order);
}