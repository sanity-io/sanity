// This dev studio does not install @types/react-dom; only `createPortal` is used.
declare module 'react-dom' {
  export function createPortal(children: import('react').ReactNode, container: Element): import('react').ReactPortal
}
