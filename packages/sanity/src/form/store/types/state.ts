export interface StateTree<T> {
  value: T | undefined
  children?: {
    [key: string]: StateTree<T>
  }
}
