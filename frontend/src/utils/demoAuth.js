// GitHub Pages is a static demo and has no Express session API.
export const isGitHubPagesDemo = import.meta.env.BASE_URL === "/e-Certificate/";

const DEMO_USER_KEY = "e-certificate-github-pages-user";

export function readDemoUser() {
  try {
    return JSON.parse(window.localStorage.getItem(DEMO_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveDemoUser(user) {
  window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

export function clearDemoUser() {
  window.localStorage.removeItem(DEMO_USER_KEY);
}
