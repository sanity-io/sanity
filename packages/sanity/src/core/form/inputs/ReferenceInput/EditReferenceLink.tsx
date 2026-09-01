import {type ComponentProps, type RefAttributes} from 'react'

import {
  type ReferenceInputOptions,
  useReferenceInputOptions,
} from '../../studio/contexts/ReferenceInputOptions'

type EditReferenceLinkProps = ComponentProps<
  NonNullable<ReferenceInputOptions['EditReferenceLinkComponent']>
> &
  RefAttributes<HTMLAnchorElement>

/**
 * Renders the `EditReferenceLinkComponent` provided through the reference input options context,
 * or nothing when none is configured. Defined at module scope so the component identity is stable
 * across renders (rendering a component type defined during render would remount the link on every
 * render). Render-scoped data (`parentRefPath`, `template`) is passed as props by the render site.
 */
export function EditReferenceLink(props: EditReferenceLinkProps) {
  const {EditReferenceLinkComponent} = useReferenceInputOptions()
  return EditReferenceLinkComponent ? <EditReferenceLinkComponent {...props} /> : null
}
