import path from 'path'

function getEnv(key: string) {
  const val = process.env[key]

  if (val === undefined) {
    throw new Error(`missing environment variable: ${key}`)
  }

  return val
}

export const config = {
  fs: {
    etcPath: path.resolve(__dirname, '../../etc/api'),
  },

  sanity: {
    projectId: getEnv('SANITY_PROJECT_ID'),
    dataset: getEnv('SANITY_DATASET'),
    token: process.env.SANITY_API_TOKEN,
  },

  workspace: [
    'sanity',
    '@sanity/block-tools',
    // '@sanity/dashboard',
    '@sanity/diff',
    // '@sanity/export',
    // '@sanity/import',
    // '@sanity/import-cli',
    '@sanity/mutator',
    '@sanity/portable-text-editor',
    '@sanity/schema',
    '@sanity/types',
    '@sanity/util',
    '@sanity/validation',
    // '@sanity/vision',
  ],
}
