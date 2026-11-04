"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userRef = doc(db, "users", result.user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        plan: "free",
        downloadsToday: 0,
        lastDownloadDate: null,
        createdAt: serverTimestamp(),
      });
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, signInWithGoogle, logout };
}