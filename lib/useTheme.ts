"use client";
import { useEffect, useState } from "react";

const SOUTH_INDIA_STATES = [
  "tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana"
];

export function useTheme() {
  const [isLight, setIsLight] = useState(false);
  const [region, setRegion] = useState("");

  useEffect(() => {
    const detectTheme = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const state = (data.region || "").toLowerCase();
        const isSouthIndia = SOUTH_INDIA_STATES.some(s => state.includes(s));

        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istTime = new Date(now.getTime() + istOffset);
        const hours = istTime.getUTCHours();
        const isCorrectTime = hours >= 10 && hours < 24;

        setRegion(state);
        setIsLight(isSouthIndia && isCorrectTime);
      } catch {
        setIsLight(false);
      }
    };
    detectTheme();
  }, []);

  return { isLight, region };
}