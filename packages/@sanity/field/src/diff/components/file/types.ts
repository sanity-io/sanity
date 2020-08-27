export interface File {
  asset?: Asset
}

type Asset = {
  _ref: string
}

export interface FilePreviewProps {
  asset: Asset | undefined
  color?: any
  action: 'changed' | 'added' | 'removed'
}
