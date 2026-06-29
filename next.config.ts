import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the SQL migration files with the /api/admin/migrate function so it can
  // run them on a VPC-internal Aurora from within Vercel.
  outputFileTracingIncludes: {
    "/api/admin/migrate": ["./db/migrations/**"],
  },
};

export default nextConfig;
