/** @internal */
export interface UploadState {
  progress: number
  /** @deprecated use createdAt instead */
  initiated?: string
  /** @deprecated use updatedAt instead */
  updated?: string

  createdAt: string
  updatedAt: string
  file: {name: string; type: string}
  previewImage?: string
}
