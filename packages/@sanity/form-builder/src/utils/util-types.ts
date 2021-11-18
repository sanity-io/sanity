export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type PartialPick<T, K extends keyof T> = Omit<T, K> &
  {
    [P in K]?: T[K]
  }
