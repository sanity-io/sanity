import {AddIcon} from '@sanity/icons'
import {Button, MenuItem} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {BundleBadge} from '../../../../bundles/components/BundleBadge'
import {BundleMenu} from '../../../../bundles/components/BundleMenu'
import {CreateBundleDialog} from '../../../../bundles/components/dialog/CreateBundleDialog'
import {usePerspective} from '../../../../bundles/hooks/usePerspective'
import {useBundles} from '../../../../store/bundles/BundlesProvider'

export function GlobalPerspectiveMenu(): JSX.Element {
  const {data: bundles, loading} = useBundles()

  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  const {currentGlobalBundle} = usePerspective()
  const {title, hue, icon} = currentGlobalBundle

  /* create new bundle */
  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  return (
    <>
      <BundleMenu
        button={
          <Button mode="bleed" padding={0} radius="full">
            <BundleBadge hue={hue} icon={icon} openButton padding={2} title={title} />
          </Button>
        }
        bundles={bundles}
        loading={loading}
        actions={
          // localize text
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          <MenuItem icon={AddIcon} onClick={handleCreateBundleClick} text="Create release" />
        }
      />

      {createBundleDialogOpen && (
        <CreateBundleDialog onCancel={handleClose} onCreate={handleClose} />
      )}
    </>
  )
}
