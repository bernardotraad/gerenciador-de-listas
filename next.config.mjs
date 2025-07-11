/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: 'loose'
  },
  // Configuração para suprimir completamente os logs TSS
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Suprimir todos os logs de webpack em desenvolvimento
    if (dev) {
      config.infrastructureLogging = {
        level: 'none',
      }
      config.stats = 'none'
    }
    
    return config
  },
  // Desabilitar logs do Next.js
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Configuração para reduzir ainda mais os logs
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suprimir avisos específicos
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
}

export default nextConfig
