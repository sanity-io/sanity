function requireResolve(id) {
  return import.meta.resolve(id).replace('file://', '')
}

// eslint-disable-next-line tsdoc/syntax
/** @type {import('next').NextConfig} */
const config = {
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['sanity-test-studio'],
  // eslint-disable-next-line @typescript-eslint/no-shadow
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sanity/vision': requireResolve('@sanity/vision'),
      'sanity/desk': requireResolve('sanity/desk'),
      'sanity/presentation': requireResolve('sanity/presentation'),
      'sanity/router': requireResolve('sanity/router'),
      'sanity/structure': requireResolve('sanity/structure'),
      'sanity': requireResolve('sanity'),
    }
    return config
  },
  async headers() {
    return [
      {
        // @TODO fix Presentation to never load itself recursively in an iframe
        source: '/(.*)?', // Matches all routes by default
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // These routes aren't working yet anyway
      // {
      //   source: '/workshop/frame/(.*)?', // Allow `@sanity/ui-workshop` iframe
      //   headers: [
      //     {
      //       key: 'X-Frame-Options',
      //       value: 'SAMEORIGIN',
      //     },
      //   ],
      // },
      // {
      //   source: '/preview/(.*)?', // Allow Presentation test iframe
      //   headers: [
      //     {
      //       key: 'X-Frame-Options',
      //       value: 'SAMEORIGIN',
      //     },
      //   ],
      // },
    ]
  },
}
export default config
