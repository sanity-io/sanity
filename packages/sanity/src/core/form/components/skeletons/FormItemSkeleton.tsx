import {Card} from '@sanity/ui'

import {DefaultPreview} from '../../../components/previews/general/DefaultPreview'

/**
 * Placeholder for an array item or Portable Text block object while a lazy item component loads.
 * Mirrors the default item row: a padded card around a default-layout preview in its placeholder
 * state.
 *
 * @internal
 */
export function FormItemSkeleton() {
  return (
    <Card data-testid="form-item-skeleton" padding={1} radius={1}>
      <DefaultPreview isPlaceholder />
    </Card>
  )
}
