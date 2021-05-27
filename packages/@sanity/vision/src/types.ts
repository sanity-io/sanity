export interface VisionErrorDetails {
  line?: string
  lineNumber?: number
  column?: number
  start?: number
  end?: number
  query?: string
}

export interface VisionError {
  details?: VisionErrorDetails
  message: string
}
