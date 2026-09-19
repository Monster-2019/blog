export type Project = {
  name: string;
  kind: "product" | "openSource";
  eyebrow: string;
  description: string;
  homepageUrl?: string;
  repositoryUrl?: string;
  articlePath?: string;
  image?: {
    src: string;
    alt: string;
  };
  stack: string[];
};

export const projects: Project[] = [
  {
    name: "FastPush",
    kind: "product",
    eyebrow: "实时消息推送平台",
    description:
      "一个简单、快速、可靠的实时消息推送平台，提供 REST API、设备管理、推送记录与多通道消息能力。",
    homepageUrl: "https://push.dxin.cc/",
    image: {
      src: "/static/images/projects/fastpush.png",
      alt: "FastPush 应用首页",
    },
    stack: ["Next.js", "FastAPI", "PostgreSQL", "Redis"],
  },
  {
    name: "Sojourn Agent",
    kind: "product",
    eyebrow: "AI 旅居规划助手",
    description:
      "根据气候、预算和生活方式等偏好，帮助用户探索更适合自己的旅居目的地。",
    homepageUrl: "https://sojourn.dxin.cc/",
    image: {
      src: "/static/images/projects/sojourn-agent.png",
      alt: "Sojourn Agent 应用界面",
    },
    stack: ["AI Agent", "旅行规划", "智能推荐"],
  },
  {
    name: "Google OAuth Relay",
    kind: "openSource",
    eyebrow: "Google OAuth 边缘中转服务",
    description:
      "运行在 Cloudflare Workers 上的轻量 OAuth 中转服务，为访问 Google OAuth 后端接口不稳定的服务提供一条简单、可自行部署的路径。",
    repositoryUrl: "https://github.com/Monster-2019/google-oauth-relay",
    articlePath: "blog/google-oauth-relay-worker",
    stack: ["Cloudflare Workers", "Hono", "TypeScript"],
  },
  {
    name: "FCM Workflow",
    kind: "openSource",
    eyebrow: "FCM 推送与定时任务工作流",
    description:
      "运行在 Cloudflare Workers 上的 FCM HTTP v1 推送服务，支持 HMAC 鉴权、KV Token 缓存，以及通过 QStash 定时发送。",
    repositoryUrl: "https://github.com/Monster-2019/monster_push_fcm_hono",
    articlePath: "blog/cloudflare-workers-fcm",
    stack: ["Cloudflare Workers", "Hono", "FCM", "QStash"],
  },
];
