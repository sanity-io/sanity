import {ArchiveIcon, EllipsisHorizontalIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem, Spinner} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'

type Props = {
  bundle?: BundleDocument
}

export const BundleMenuButton = ({bundle}: Props) => {
  const {deleteBundle, updateBundle} = useBundleOperations()
  const router = useRouter()
  const isBundleArchived = !!bundle?.archivedAt
  const [isPerformingOperation, setIsPerformingOperation] = useState(false)

  const bundleMenuDisabled = !bundle

  const handleOnDeleteBundle = async () => {
    if (bundleMenuDisabled) return

    setIsPerformingOperation(true)
    await deleteBundle(bundle._id)
    setIsPerformingOperation(false)
    if (router.state.bundleName) {
      // navigate back to bundle overview
      router.navigate({bundleName: undefined})
    }
  }

  const handleOnToggleArchive = async () => {
    if (bundleMenuDisabled) return

    setIsPerformingOperation(true)
    await updateBundle({
      ...bundle,
      archivedAt: isBundleArchived ? undefined : new Date().toISOString(),
    })
    setIsPerformingOperation(false)
  }

  return (
    <MenuButton
      button={
        <Button
          disabled={bundleMenuDisabled || isPerformingOperation}
          icon={isPerformingOperation ? Spinner : EllipsisHorizontalIcon}
          mode="bleed"
          padding={2}
          aria-label="Release menu"
        />
      }
      id="bundle-menu"
      menu={
        <Menu>
          <MenuItem
            onClick={handleOnToggleArchive}
            icon={isBundleArchived ? UnarchiveIcon : ArchiveIcon}
            text={isBundleArchived ? 'Unarchive' : 'Archive'}
          />
          <MenuItem onClick={handleOnDeleteBundle} icon={TrashIcon} text="Delete" />
        </Menu>
      }
      popover={{
        constrainSize: true,
        fallbackPlacements: [],
        placement: 'bottom',
        portal: true,
      }}
    />
  )
}
