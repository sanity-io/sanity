export interface InsertItemEvent {
  items: unknown[]
  position: 'before' | 'after'
  referenceItem: number | string
}
export interface MoveItemEvent {
  fromIndex: number
  toIndex: number
}
