export interface InsertEvent {
  items: unknown[]
  position: 'before' | 'after'
  reference: number | string
}
