/* oxlint-disable typescript/consistent-type-imports -- an ambient module shim: a top-level import would turn it into an augmentation */
// This dev studio does not install @types/react-dom; only `createPortal` is used.
declare module 'react-dom' {
  export function createPortal(
    children: import('react').ReactNode,
    container: Element,
  ): import('react').ReactPortal
}
