import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// After a new deploy, tabs opened earlier request old chunk files that no longer exist.
// Reload once to pick up the fresh build instead of showing a blank screen.
if (typeof window !== "undefined" && !(window as any).__chunkReloadInstalled) {
  (window as any).__chunkReloadInstalled = true;
  const isChunkError = (msg: unknown) =>
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      String(msg ?? ""),
    );
  const reloadOnce = () => {
    const key = "swapspace-chunk-reload";
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  };
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (isChunkError((e.reason as Error)?.message ?? e.reason)) reloadOnce();
  });
  window.addEventListener("error", (e) => {
    if (isChunkError(e.message)) reloadOnce();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 40,
    defaultPreloadStaleTime: 0,

  });

  return router;
};
