import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  // Vite BASE_URL is '/' or '/TaylorAI/' — TanStack wants no trailing slash (except root)
  const rawBase = import.meta.env.BASE_URL || "/";
  const basepath = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");

  const router = createRouter({
    routeTree,
    context: { queryClient },
    ...(basepath ? { basepath } : {}),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
