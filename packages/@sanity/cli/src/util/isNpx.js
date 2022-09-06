const isNpx =
  process.argv.some((segment) => segment.includes('_npx')) ||
  process.env.npm_lifecycle_event === 'npx'

export const prefixCommand = (command = '') =>
  (isNpx ? `npx @sanity/cli ${command}` : `sanity ${command}`).trim()
