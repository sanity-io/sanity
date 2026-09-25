import {StarIcon} from '@sanity/icons/Star'
import {StarFilledIcon} from '@sanity/icons/StarFilled'
import {useFavorite, useUpdateFavorite} from '@sanity/sdk-react'
import {Text} from '@sanity/ui'
import {Suspense, useOptimistic, useTransition} from 'react'
import {useTranslation, useWorkspace} from 'sanity'

import {Button} from '../../../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../../../i18n'

interface FavoriteToggleProps {
  documentId: string
  documentType: string
  documentExists: boolean
}

export function FavoriteToggle(props: FavoriteToggleProps) {
  return (
    // The favorite status is read from the host, which answers asynchronously.
    <Suspense fallback={<FavoriteButton isFavorited={false} disabled />}>
      <HostFavoriteToggle {...props} />
    </Suspense>
  )
}

function HostFavoriteToggle({documentId, documentType, documentExists}: FavoriteToggleProps) {
  const {projectId, dataset, name} = useWorkspace()
  const document = {
    documentId,
    documentType,
    resourceType: 'studio',
    resourceId: `${projectId}.${dataset}`,
    schemaName: name,
  } satisfies Parameters<typeof useFavorite>[0]
  const isFavorited = useFavorite(document)
  const {favorite, unfavorite} = useUpdateFavorite(document)
  const [optimisticIsFavorited, setOptimisticIsFavorited] = useOptimistic(isFavorited)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    // A second write while one is in flight could land first, so the click waits for it to settle.
    if (isPending) return
    startTransition(async () => {
      setOptimisticIsFavorited(!optimisticIsFavorited)
      await (optimisticIsFavorited ? unfavorite() : favorite()).catch((error: unknown) => {
        console.error('Favorites service write error', error)
      })
    })
  }

  return (
    <FavoriteButton
      isFavorited={optimisticIsFavorited}
      disabled={!documentExists}
      onClick={toggle}
    />
  )
}

function FavoriteButton({
  isFavorited,
  disabled,
  onClick,
}: {
  isFavorited: boolean
  disabled: boolean
  onClick?: () => void
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const description = t(
    isFavorited
      ? 'document.favorites.remove-from-favorites'
      : 'document.favorites.add-to-favorites',
  )

  return (
    <Button
      mode="bleed"
      onClick={onClick}
      disabled={disabled}
      aria-label={description}
      aria-live="assertive"
      tooltipProps={{
        content: <Text size={1}>{description}</Text>,
        placement: 'right',
      }}
    >
      <Text size={1}>{isFavorited ? <StarFilledIcon /> : <StarIcon />}</Text>
    </Button>
  )
}
