declare module 'fast-fifo' {
  declare class FixedFIFO<T> {
    constructor(hwm: number)
    buffer: T[]
    mask: number
    top: number
    btm: number
    next: FixedFIFO<T> | null
    push(data: T): boolean
    peek(): T
    shift(): T | undefined
    isEmpty(): boolean
  }
  declare class FastFIFO<T> {
    constructor(hwm?: number)
    hwm: number
    head: FixedFIFO<T>
    tail: FixedFIFO<T>
    push(val: T): void
    peek(): T
    shift(): T | undefined
    isEmpty(): boolean
  }
  export default FastFIFO
}
