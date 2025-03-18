import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api/wallet": {
          target: "https://cardano-mainnet.blockfrost.io/api/v0",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wallet/, "/addresses"),
          headers: {
            project_id: env.VITE_BLOCKFROST_API_KEY || "",
          },
        },
      },
    },
  };
});
