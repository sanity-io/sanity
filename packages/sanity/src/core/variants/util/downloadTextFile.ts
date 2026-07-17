/**
 * Trigger a browser download of a text file. Side-effectful and browser-only (used for exporting a
 * variant set to JSON); kept tiny and separate so the surrounding logic stays pure and testable.
 *
 * @internal
 */
export function downloadTextFile(
  filename: string,
  contents: string,
  type = 'application/json',
): void {
  const blob = new Blob([contents], {type})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}
