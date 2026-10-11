/**
 * The smallest possible studio tool: renders a marker and nothing else, so a
 * load that ends on it measures the studio shell (auth, workspace, navbar)
 * without any tool's own code or data.
 */
export function EmptyTool() {
  return <div data-testid="bench-empty-tool">Empty tool</div>
}
