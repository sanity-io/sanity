// The dev studio installs no @types/react-dom; the option tests only need `createRoot`.
declare module 'react-dom/client' {
  export function createRoot(container: Element): {
    render(children: unknown): void
    unmount(): void
  }
}
