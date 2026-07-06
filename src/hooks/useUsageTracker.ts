"use client";

import { useState, useEffect, useCallback } from "react";

// Helper to read cookie values in Client Components
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Helper to write cookie values
function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + value + expires + "; path=/; SameSite=Lax";
}

export function useUsageTracker() {
  const [visitorId, setVisitorId] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [maxCount] = useState(3);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redundant Double-Binding Visitor ID syncing
  useEffect(() => {
    if (typeof window === "undefined") return;

    let id = localStorage.getItem("visitor_id");
    let cookieId = getCookie("visitor_id");

    if (!id && !cookieId) {
      // Generate new Visitor ID
      id = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      localStorage.setItem("visitor_id", id);
      setCookie("visitor_id", id);
    } else if (id && !cookieId) {
      // Restore cookie from localStorage
      setCookie("visitor_id", id);
    } else if (!id && cookieId) {
      // Restore localStorage from cookie
      localStorage.setItem("visitor_id", cookieId);
      id = cookieId;
    }

    setVisitorId(id || "");
  }, []);

  const checkUsageLimit = useCallback(async () => {
    if (!visitorId) return false;

    try {
      const res = await fetch(`/api/auth/usage-status?visitorId=${visitorId}`);
      if (!res.ok) throw new Error("Failed to fetch usage status.");
      
      const data = await res.json();
      setLoggedIn(data.loggedIn);
      setUsageCount(data.count);
      
      const isReached = !data.loggedIn && data.count >= maxCount;
      if (isReached) {
        setAuthModalOpen(true);
      }
      return isReached;
    } catch (error) {
      console.error("Error verifying usage bounds client-side:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [visitorId, maxCount]);

  useEffect(() => {
    if (visitorId) {
      checkUsageLimit();
    }
  }, [visitorId, checkUsageLimit]);

  const limitReached = !loggedIn && usageCount >= maxCount;

  return {
    visitorId,
    loggedIn,
    usageCount,
    maxCount,
    limitReached,
    authModalOpen,
    setAuthModalOpen,
    checkUsageLimit,
    loading,
  };
}
