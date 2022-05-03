export interface InsertEvent {
  items: unknown[]
  position: 'before' | 'after'
  referenceItem: number | string
}
