import {AddIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'sanity'

import {MenuItem} from '../../../../../ui-components'
import {ReleaseDetailsDialog} from '../../../../bundles/components/dialog/ReleaseDetailsDialog'
import {ReleaseBadge} from '../../../../bundles/components/ReleaseBadge'
import {ReleasesMenu} from '../../../../bundles/components/ReleasesMenu'
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
        <ReleaseBadge hue={hue} icon={icon} openButton padding={2} title={title} />
      </Button>
    ),
    [hue, icon, title],
  )

  const bundleMenuActions = useMemo(
    () => (
      <MenuItem
        icon={AddIcon}
        onClick={handleCreateBundleClick}
        text={t('release.action.create')}
      />
    ),
    [handleCreateBundleClick, t],
  )

  return (
    <>
      <ReleasesMenu
        button={bundleMenuButton}
        bundles={menuBundles}
        loading={loading}
        actions={bundleMenuActions}
      />

      {createBundleDialogOpen && (
        <ReleaseDetailsDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
