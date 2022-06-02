export interface UploadState {
  progress: number
  initiated: string
  updated: string
  file: {name: string; type: string}
  previewImage?: string
}
