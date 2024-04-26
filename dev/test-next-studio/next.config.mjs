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
  transpilePackages: [
    '@sanity/block-tools',
    '@sanity/cli',
    '@sanity/diff',
    '@sanity/migrate',
    '@sanity/mutator',
    '@sanity/portable-text-editor',
    '@sanity/schema',
    '@sanity/types',
    '@sanity/util',
    '@sanity/vision',
    'sanity-test-studio',
    'sanity',
  ],
  // eslint-disable-next-line @typescript-eslint/no-shadow
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sanity/block-tools': requireResolve('../../packages/@sanity/block-tools/src/index.ts'),
      '@sanity/diff': requireResolve('../../packages/@sanity/diff/src/index.ts'),
      '@sanity/cli': requireResolve('../../packages/@sanity/cli/src/index.ts'),
      '@sanity/mutator': requireResolve('../../packages/@sanity/mutator/src/index.ts'),
      '@sanity/portable-text-editor': requireResolve(
        '../../packages/@sanity/portable-text-editor/src/index.ts',
      ),
      '@sanity/schema/_internal': requireResolve(
        '../../packages/@sanity/schema/src/_exports/_internal.ts',
      ),
      '@sanity/schema': requireResolve('../../packages/@sanity/schema/src/_exports/index.ts'),
      '@sanity/migrate': requireResolve('../../packages/@sanity/migrate/src/_exports/index.ts'),
      '@sanity/types': requireResolve('../../packages/@sanity/types/src/index.ts'),
      '@sanity/util/fs': requireResolve('../../packages/@sanity/util/src/_exports/fs.ts'),
      '@sanity/util/client': requireResolve('../../packages/@sanity/util/src/_exports/client.ts'),
      '@sanity/util/concurrency-limiter': requireResolve(
        '../../packages/@sanity/util/src/_exports/concurrency-limiter.ts',
      ),
      '@sanity/util/content': requireResolve('../../packages/@sanity/util/src/_exports/content.ts'),
      '@sanity/util/createSafeJsonParser': requireResolve(
        '../../packages/@sanity/util/src/_exports/createSafeJsonParser.ts',
      ),
      '@sanity/util/legacyDateFormat': requireResolve(
        '../../packages/@sanity/util/src/_exports/legacyDateFormat.ts',
      ),
      '@sanity/util/paths': requireResolve('../../packages/@sanity/util/src/_exports/paths.ts'),
      '@sanity/util': requireResolve('../../packages/@sanity/util/src/_exports/index.ts'),
      '@sanity/vision': requireResolve('../../packages/@sanity/vision/src/index.ts'),
      'sanity/_internal': requireResolve('../../packages/sanity/src/_exports/_internal.ts'),
      'sanity/cli': requireResolve('../../packages/sanity/src/_exports/cli.ts'),
      'sanity/desk': requireResolve('../../packages/sanity/src/_exports/desk.ts'),
      'sanity/presentation': requireResolve('../../packages/sanity/src/_exports/presentation.ts'),
      'sanity/router': requireResolve('../../packages/sanity/src/_exports/router.ts'),
      'sanity/structure': requireResolve('../../packages/sanity/src/_exports/structure.ts'),
      'sanity/migrate': requireResolve('../../packages/sanity/src/_exports/migrate.ts'),
      'sanity': requireResolve('../../packages/sanity/src/_exports/index.ts'),
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
