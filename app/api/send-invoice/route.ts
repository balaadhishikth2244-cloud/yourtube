import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { email, name, plan, amount, orderId } = await req.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const planEmoji: Record<string, string> = {
    bronze: "🥉", silver: "🥈", gold: "🥇",
  };

  const planLimits: Record<string, string> = {
    bronze: "3 downloads/day",
    silver: "10 downloads/day",
    gold: "Unlimited downloads",
  };

  await transporter.sendMail({
    from: `"YouTube Clone" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Invoice - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Activated ${planEmoji[plan]}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background: #ff0000; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">▶ YouTube Clone</h1>
          <p style="color: #ffcccc; margin: 6px 0 0 0;">Payment Invoice</p>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p>Your payment was successful and your plan has been activated!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Plan</strong></td>
              <td style="padding: 12px; border: 1px solid #eee;">${plan.charAt(0).toUpperCase() + plan.slice(1)} ${planEmoji[plan]}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Amount Paid</strong></td>
              <td style="padding: 12px; border: 1px solid #eee; color: #2e7d32; font-weight: bold;">₹${amount}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Downloads</strong></td>
              <td style="padding: 12px; border: 1px solid #eee;">${planLimits[plan]}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Order ID</strong></td>
              <td style="padding: 12px; border: 1px solid #eee; font-size: 13px; color: #666;">${orderId}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #eee;"><strong>Date</strong></td>
              <td style="padding: 12px; border: 1px solid #eee;">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 13px; margin-top: 20px;">This is an auto-generated invoice. Please keep it for your records.</p>
        </div>
        <div style="background: #f5f5f5; padding: 14px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">© 2025 YouTube Clone. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}