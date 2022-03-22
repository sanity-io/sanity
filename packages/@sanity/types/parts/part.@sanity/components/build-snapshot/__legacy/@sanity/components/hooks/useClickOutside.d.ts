import type {Dispatch, SetStateAction} from 'react'
declare type ClickOutsideListener = (event: Event) => void
export declare function useClickOutside(
  listener: ClickOutsideListener,
  elementsArg?: Array<HTMLElement | null>
): Dispatch<SetStateAction<HTMLElement>>
export {}
