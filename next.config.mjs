/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para Vercel
  experimental: {
    // Otimizações de performance
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Configurações de imagem
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Configurações de redirecionamento
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Configurações de rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Configurações de compressão
  compress: true,

  // Configurações de bundle analyzer (apenas em desenvolvimento)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        }))()
      )
      return config
    },
  }),

  // Configurações de output
  output: 'standalone',

  // Configurações de trailing slash
  trailingSlash: false,

  // Configurações de powered by header
  poweredByHeader: false,

  // Configurações de react strict mode
  reactStrictMode: true,

  // Configurações de swc minify
  swcMinify: true,
}

export default nextConfig
