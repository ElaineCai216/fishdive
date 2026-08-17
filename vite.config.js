import { defineConfig } from "vite";

// base: "./" 让构建产物使用相对路径，可部署到 GitHub Pages 子路径或任意静态托管
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
});
