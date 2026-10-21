import {useRouter} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

interface Address {
  perspective: string
  variant: string
}

const NONE = 'none'

/** The global address (router sticky params), the pane's local one (pane params), and whether the pane differs from the global one. */
export function usePaneAddress() {
  const paneRouter = usePaneRouter()
  const router = useRouter()
  const params = paneRouter.params as {localPerspective?: string; localVariant?: string}
  const stickyPerspective = router.stickyParams.perspective
  const stickyVariant = router.stickyParams.variant
  const global: Address = {
    perspective: typeof stickyPerspective === 'string' ? stickyPerspective : 'drafts',
    variant: typeof stickyVariant === 'string' ? stickyVariant : NONE,
  }
  const held = Boolean(params.localPerspective || params.localVariant)
  const local: Address = held
    ? {perspective: params.localPerspective ?? 'drafts', variant: params.localVariant ?? NONE}
    : global
  const differs =
    held && (local.perspective !== global.perspective || local.variant !== global.variant)
  const set = (next: Address | null) =>
    paneRouter.setParams({
      ...paneRouter.params,
      localPerspective: next?.perspective,
      localVariant: next?.variant,
    })
  return {held, local, global, differs, set}
}

export const layerLabel = (perspective: string) =>
  perspective === 'published' ? 'Published' : perspective === 'drafts' ? 'Drafts' : perspective
