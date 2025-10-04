// Configuração de rotas modificada pelo Claude Sonnet 4.5
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("analysis", "routes/analysis.tsx"),
  route("results", "routes/results.tsx"),
] satisfies RouteConfig;
