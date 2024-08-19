import {AddIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'sanity'

import {MenuItem} from '../../../../../ui-components'
import {BundleBadge} from '../../../../bundles/components/BundleBadge'
import {BundlesMenu} from '../../../../bundles/components/BundlesMenu'
import {BundleDetailsDialog} from '../../../../bundles/components/dialog/BundleDetailsDialog'
import {usePerspective} from '../../../../bundles/hooks/usePerspective'
import {useBundles} from '../../../../store/bundles'

export function GlobalPerspectiveMenu(): JSX.Element {
  const {data: bundles, loading, deletedBundles} = useBundles()

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

  const menuBundles = useMemo(
    () => [...(bundles || []), ...Object.values(deletedBundles)],
    [bundles, deletedBundles],
  )

  const bundleMenuButton = useMemo(
    () => (
      <Button mode="bleed" padding={0} radius="full">
        <BundleBadge hue={hue} icon={icon} openButton padding={2} title={title} />
      </Button>
    ),
    [hue, icon, title],
  )

  const bundleMenuActions = useMemo(
    () => (
      <MenuItem icon={AddIcon} onClick={handleCreateBundleClick} text={t('bundle.action.create')} />
    ),
    [handleCreateBundleClick, t],
  )

  return (
    <>
      <BundlesMenu
        button={bundleMenuButton}
        bundles={menuBundles}
        loading={loading}
        actions={bundleMenuActions}
      />

      {createBundleDialogOpen && (
        <BundleDetailsDialog onCancel={handleClose} onSubmit={handleClose} />
      )}
    </>
  )
}
