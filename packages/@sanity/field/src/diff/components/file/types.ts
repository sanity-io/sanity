export interface File {
  asset?: Reference
}

interface Reference {
  _ref: string
  _weak?: boolean
}

export interface FileAsset {
  size: number
  originalFilename?: string
}

export interface FilePreviewProps {
  asset: Reference | undefined
  color?: any
  action: 'changed' | 'added' | 'removed'
}
