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
 * or nothing when none is configured. Render-scoped data (`parentRefPath`, `template`) must be
 * passed as props by the render site; closing over it here would recreate the component type and
 * remount the link.
 */
export function EditReferenceLink(props: EditReferenceLinkProps) {
  const {EditReferenceLinkComponent} = useReferenceInputOptions()
  return EditReferenceLinkComponent ? <EditReferenceLinkComponent {...props} /> : null
}
