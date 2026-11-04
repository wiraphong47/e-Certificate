import { useCallback, useEffect, useState } from "react";

// Load the signed-in user once and expose the shared logout action to pages.
export default function useAuthSession() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => {
        if (!response.ok) throw new Error("Not signed in");
        return response.json();
      })
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }, []);

  return { user, checking, logout };
}
