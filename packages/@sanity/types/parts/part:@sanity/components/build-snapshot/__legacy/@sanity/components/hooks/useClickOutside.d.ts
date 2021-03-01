/// <reference types="react" />
declare type ClickOutsideListener = (event: Event) => void
export declare function useClickOutside(
  listener: ClickOutsideListener,
  elementsArg?: Array<HTMLElement | null>
): import('react').Dispatch<import('react').SetStateAction<HTMLElement>>
export {}
