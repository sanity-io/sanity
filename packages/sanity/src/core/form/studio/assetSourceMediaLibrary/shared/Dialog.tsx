// oxlint-disable-next-line no-restricted-imports -- This has some special implementation needed from @sanity/ui
import {Dialog} from '@sanity/ui'
import {styled} from 'styled-components'

export const AppDialog = styled(Dialog)`
  padding: 1.5rem;
  [data-ui='Card']:first-child {
    flex: 1;
  }
`

/**
 * Full-surface variant for the federated view dialogs: the view mounts the
 * whole Media Library app (folder nav, grid, detail sidebar), so the dialog
 * fills the studio surface — the 1.5rem padding above is the only margin —
 * instead of stopping at the `width` prop's container scale (which caps at
 * 1920px and reads as a centered box on wider displays). The explicit
 * max-width keeps it sane on ultrawide monitors.
 */
export const FullSurfaceAppDialog = styled(AppDialog)`
  [data-ui='DialogCard'] {
    width: 100%;
    height: 100%;
    max-width: 2560px;
  }
`
