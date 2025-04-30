export interface CompanionDoc {
  _id: string
  canvasDocumentId: string
  studioDocumentId: string
}

export interface CanvasDiff {
  indexedPath: string[]
  prevValue: unknown
  value: unknown
  type: string
}
