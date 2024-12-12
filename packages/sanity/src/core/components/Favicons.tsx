export interface FaviconProps {
  /** @deprecated No longer needed/used - will be added by Vite automatically */
  basePath?: string
}

export function Favicons(_props: FaviconProps) {
  const base = '/static'
  return (
    <>
      <link rel="icon" href={`${base}/favicon.ico`} sizes="any" />
      <link rel="icon" href={`${base}/favicon.svg`} type="image/svg+xml" />
      <link rel="apple-touch-icon" href={`${base}/apple-touch-icon.png`} />
      <link rel="manifest" href={`${base}/manifest.webmanifest`} />
    </>
  )
}
