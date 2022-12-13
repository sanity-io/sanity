export interface WebManifest {
  icons: {
    src: string
    type: string
    sizes: string
  }[]
}

export function generateWebManifest(basePath: string): WebManifest {
  return {
    icons: [
      {src: `${basePath}/favicon-192.png`, type: 'image/png', sizes: '192x192'},
      {src: `${basePath}/favicon-512.png`, type: 'image/png', sizes: '512x512'},
    ],
  }
}
