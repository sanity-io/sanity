const FALLBACK_PORT = 3000

const portMap: Record<string, number> = {
  'nextjs': 3000,
  'blitzjs': 3000,
  'gatsby': 8000,
  'remix': 3000,
  'astro': 4321,
  'hexo': 4000,
  'eleventy': 8080,
  'docusaurus': 3000,
  'docusaurus-2': 3000,
  'preact': 8080,
  'solidstart': 3000,
  'solidstart-1': 3000,
  'dojo': 3000,
  'ember': 4200,
  'vue': 8080,
  'scully': 1668,
  'ionic-angular': 4200,
  'angular': 4200,
  'polymer': 8081,
  'svelte': 5000,
  'sveltekit': 5173,
  'sveltekit-1': 5173,
  'ionic-react': 3000,
  'create-react-app': 3000,
  'gridsome': 8080,
  'umijs': 8000,
  'saber': 3000,
  'stencil': 3333,
  'nuxtjs': 3000,
  'redwoodjs': 8910,
  'hugo': 1313,
  'jekyll': 4000,
  'brunch': 3333,
  'middleman': 4567,
  'zola': 1111,
  'hydrogen': 3000,
  'vite': 5173,
  'vitepress': 5173,
  'vuepress': 8080,
  'parcel': 1234,
  'fasthtml': 8000,
  'sanity': 3333,
  'sanity-v3': 3333,
  'storybook': 6006,
}

/**
 * Returns the default development port for a given framework.
 * Contains default ports for all frameworks supported by `@vercel/frameworks`.
 * Falls back to port 3000 if framework is not found or not specified.
 *
 * @see https://github.com/vercel/vercel/blob/main/packages/frameworks/src/frameworks.ts
 * for the complete list of supported frameworks
 *
 * @param frameworkSlug - The framework identifier from `@vercel/frameworks`
 * @returns The default port number for the framework
 */
export function getDefaultPortForFramework(frameworkSlug?: string | null): number {
  return portMap[frameworkSlug ?? ''] ?? FALLBACK_PORT
}
