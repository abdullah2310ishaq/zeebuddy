import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingIncludes: {
    '/api/**': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/runtime/**/*',
    ],
    '/**': [
      './node_modules/.prisma/client/**/*',
      './node_modules/@prisma/client/runtime/**/*',
    ],
  },
};

export default nextConfig;
