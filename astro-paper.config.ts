import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://www.dxin.cc/",
    title: "Monster Cone",
    description:
      "Monster Cone 的个人技术博客，记录前端开发、Next.js、React、Vue、TypeScript、全栈实践、独立开发项目、效率工具和生活思考。",
    author: "Monster Cone",
    profile: "https://github.com/Monster-2019",
    logo: "static/images/logo.jpg",
    favicon: "static/favicons/favicon.ico",
    baiduVerification: "codeva-fnWxlKscnT",
    ogImage: "logo.jpg",
    lang: "zh-cn",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 8,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/satnaing/astro-paper/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/Monster-2019" },
    { name: "mail", url: "mailto:dongxin2019@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
