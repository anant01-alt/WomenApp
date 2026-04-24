import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SafeGuard — Women's Safety",
    short_name: "SafeGuard",
    description:
      "Real-time SOS, live GPS tracking, emergency contacts, and web-push alerts.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b1a",
    theme_color: "#0b0b1a",
    categories: ["lifestyle", "utilities", "health"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
