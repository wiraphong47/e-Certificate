import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearDemoUser,
  isGitHubPagesDemo,
  readDemoUser,
} from "../utils/demoAuth";

// Load the signed-in user once and expose the shared logout action to pages.
export default function useAuthSession() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    if (isGitHubPagesDemo) {
      setUser(readDemoUser() || false);
      setChecking(false);
      return () => {
        active = false;
      };
    }

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
    if (isGitHubPagesDemo) {
      clearDemoUser();
      navigate("/", { replace: true });
      return;
    }

    await fetch("/api/auth/logout", { method: "POST" });
    navigate("/", { replace: true });
  }, [navigate]);

  return { user, checking, logout };
}
