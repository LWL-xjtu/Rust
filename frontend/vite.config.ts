import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  plugins: [react()],
  base: isGithubPagesBuild ? "/Rust/" : "/",
});