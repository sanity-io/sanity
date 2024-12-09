function requireResolve(id) {
  return import.meta.resolve(id).replace('file://', '')
}

const reactProductionProfiling = process.env.REACT_PRODUCTION_PROFILING === 'true'

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
  env: {
    // Support the ability to debug log the studio, for example `DEBUG="sanity:pte:* pnpm dev:next-studio"`
    DEBUG: process.env.DEBUG,
    // Matches the behavior of `sanity dev` which sets styled-components to use the fastest way of inserting CSS rules in both dev and production. It's default behavior is to disable it in dev mode.
    SC_DISABLE_SPEEDY: 'false',
  },
  transpilePackages: [
    '@sanity/block-tools',
    '@sanity/cli',
    '@sanity/diff',
    '@sanity/migrate',
    '@sanity/mutator',
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
      'sanity/_singletons': requireResolve('../../packages/sanity/src/_exports/_singletons.ts'),
      'sanity/_createContext': requireResolve(
        '../../packages/sanity/src/_exports/_createContext.ts',
      ),
      'sanity/cli': requireResolve('../../packages/sanity/src/_exports/cli.ts'),
      'sanity/desk': requireResolve('../../packages/sanity/src/_exports/desk.ts'),
      'sanity/presentation': requireResolve('../../packages/sanity/src/_exports/presentation.ts'),
      'sanity/router': requireResolve('../../packages/sanity/src/_exports/router.ts'),
      'sanity/structure': requireResolve('../../packages/sanity/src/_exports/structure.ts'),
      'sanity/migrate': requireResolve('../../packages/sanity/src/_exports/migrate.ts'),
      'sanity': requireResolve('../../packages/sanity/src/_exports/index.ts'),
      'styled-components': requireResolve(
        'styled-components/dist/styled-components.browser.esm.js',
      ),
    }
    return config
  },
  // Makes it much easier to see which component got memoized by the react compiler
  // when testing on https://test-next-studio.sanity.build
  productionBrowserSourceMaps: reactProductionProfiling,
  reactProductionProfiling,
  experimental: {
    reactCompiler: true,
    turbo: {
      resolveAlias: {
        '@sanity/block-tools': '@sanity/block-tools/src/index.ts',
        '@sanity/diff': '@sanity/diff/src/index.ts',
        '@sanity/cli': '@sanity/cli/src/index.ts',
        '@sanity/mutator': '@sanity/mutator/src/index.ts',
        '@sanity/schema/_internal': '@sanity/schema/src/_exports/_internal.ts',
        '@sanity/schema': '@sanity/schema/src/_exports/index.ts',
        '@sanity/migrate': '@sanity/migrate/src/_exports/index.ts',
        '@sanity/types': '@sanity/types/src/index.ts',
        '@sanity/util/fs': '@sanity/util/src/_exports/fs.ts',
        '@sanity/util/client': '@sanity/util/src/_exports/client.ts',
        '@sanity/util/concurrency-limiter': '@sanity/util/src/_exports/concurrency-limiter.ts',
        '@sanity/util/content': '@sanity/util/src/_exports/content.ts',
        '@sanity/util/createSafeJsonParser': '@sanity/util/src/_exports/createSafeJsonParser.ts',
        '@sanity/util/legacyDateFormat': '@sanity/util/src/_exports/legacyDateFormat.ts',
        '@sanity/util/paths': '@sanity/util/src/_exports/paths.ts',
        '@sanity/util': '@sanity/util/src/_exports/index.ts',
        '@sanity/vision': '@sanity/vision/src/index.ts',
        'sanity/_internal': 'sanity/src/_exports/_internal.ts',
        'sanity/_singletons': 'sanity/src/_exports/_singletons.ts',
        'sanity/_createContext': 'sanity/src/_exports/_createContext.ts',
        'sanity/cli': 'sanity/src/_exports/cli.ts',
        'sanity/desk': 'sanity/src/_exports/desk.ts',
        'sanity/presentation': 'sanity/src/_exports/presentation.ts',
        'sanity/router': 'sanity/src/_exports/router.ts',
        'sanity/structure': 'sanity/src/_exports/structure.ts',
        'sanity/migrate': 'sanity/src/_exports/migrate.ts',
        'sanity': 'sanity/src/_exports/index.ts',
        'styled-components': {browser: 'styled-components/dist/styled-components.browser.esm.js'},
      },
    },
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
