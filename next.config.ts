import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The backend API URL is injected at build/runtime via NEXT_PUBLIC_API_URL.
  // In development this points to localhost:8000.
  // In production (Vercel) it points to the EC2 instance public DNS/IP.
  // Never hardcode the backend URL here.

  // Allow images from the RayZar backend if we serve any in future
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
