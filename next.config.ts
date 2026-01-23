import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // 图片优化配置
  images: {
    // 允许的图片域名
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // 优化格式
    formats: ["image/avif", "image/webp"],
    // 缓存时间（秒）
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
  },

  // 压缩配置
  compress: true,

  // HTTP 头配置
  async headers() {
    return [
      {
        // 静态资源缓存
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|mp4|webm)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // JS/CSS 缓存
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 安全头 - 所有页面
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
