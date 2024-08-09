import {AddIcon} from '@sanity/icons'
import {Button, MenuItem} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity'

import {BundleBadge} from '../../../../bundles/components/BundleBadge'
import {BundleMenu} from '../../../../bundles/components/BundleMenu'
import {BundleDetailsDialog} from '../../../../bundles/components/dialog/BundleDetailsDialog'
import {usePerspective} from '../../../../bundles/hooks/usePerspective'
import {useBundles} from '../../../../store/bundles'

export function GlobalPerspectiveMenu(): JSX.Element {
  const {data: bundles, loading} = useBundles()

  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  const {currentGlobalBundle} = usePerspective()
  const {title, hue, icon} = currentGlobalBundle
  const {t} = useTranslation()

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
          <MenuItem
            icon={AddIcon}
            onClick={handleCreateBundleClick}
            text={t('bundle.action.create')}
          />
        }
      />

      {createBundleDialogOpen && (
        <BundleDetailsDialog onCancel={handleClose} onSubmit={handleClose} />
      )}
    </>
  )
}
