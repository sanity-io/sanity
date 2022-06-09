import React from 'react'

export interface FaviconProps {
  basePath: string
}

export function Favicons({basePath}: FaviconProps) {
  const base = `${basePath.replace(/\/+$/, '')}/static`
  return (
    <>
      <link rel="icon" href={`${base}/favicon.ico`} sizes="any" />
      <link rel="icon" href={`${base}/favicon.svg`} type="image/svg+xml" />
      <link rel="apple-touch-icon" href={`${base}/apple-touch-icon.png`} />
      <link rel="manifest" href={`${base}/manifest.webmanifest`} />
    </>
  )
}
