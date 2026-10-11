import {useEffect} from 'react'

/**
 * Starts fetching the code-split studio shell (default layout and navbar) so that the fetch
 * overlaps with workspace loading instead of adding a round trip once the workspace is ready.
 * The imports resolve to the same chunks the lazy components request, so nothing is loaded twice.
 */
function preloadStudioShell(): void {
  Promise.all([
    import('./StudioLayoutComponent'),
    import('./components/navbar/StudioNavbar'),
  ]).catch(() => {
    // Ignored: rendering the lazy components surfaces load failures through the error boundary.
  })
}

/**
 * Mount inside the authenticated part of the tree; renders nothing.
 *
 * @internal
 */
export function PreloadStudioShell(): null {
  useEffect(() => {
    preloadStudioShell()
  }, [])

  return null
}
