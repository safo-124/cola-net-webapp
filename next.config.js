/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only proxy /api/* to local backend when no explicit API URL is set
  ...(process.env.NEXT_PUBLIC_API_URL
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://127.0.0.1:8000/api/:path*",
            },
          ];
        },
      }),
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pptxgenjs ES module imports node:fs etc at top-level.
      // Webpack 5 in Next.js 14 treats "node:" as an unknown URI scheme.
      // Strip the prefix early so resolve.fallback can map them to false.
      config.plugins.push({
        apply(compiler) {
          compiler.hooks.normalModuleFactory.tap("NodeProtocol", (factory) => {
            factory.hooks.beforeResolve.tap("NodeProtocol", (resolveData) => {
              if (resolveData.request.startsWith("node:")) {
                resolveData.request = resolveData.request.slice(5);
              }
            });
          });
        },
      });
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
