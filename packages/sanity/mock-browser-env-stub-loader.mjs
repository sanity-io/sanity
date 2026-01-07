const fileExtensions = [
  '.css',
  '.eot',
  '.gif',
  '.jpeg',
  '.jpg',
  '.otf',
  '.png',
  '.sass',
  '.scss',
  '.svg',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
]

export async function load(url, context, nextLoad) {
  if (fileExtensions.some((extension) => url.endsWith(extension))) {
    return {
      format: 'module',
      source: `export default ${JSON.stringify(url)}`,
      shortCircuit: true,
    }
  }
  return nextLoad(url, context)
}
