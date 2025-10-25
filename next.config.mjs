/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Network configuration for mobile hotspot access
  // Note: Host binding for dev can be done with the `dev:host` script (see package.json).
  webpack: (config, { dev, isServer }) => {
    // Only use polling on network drives or when needed (not for local development)
    // Polling slows down compilation significantly - disable for better performance
    if (dev && !isServer) {
      config.watchOptions = {
        // Use native file watching instead of polling for much better performance
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
    }

    // Optimize module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
    }

    return config
  },
  // Enable hostname access from mobile devices
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,HEAD,PUT,PATCH,POST,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ]
  }
}

export default nextConfig
