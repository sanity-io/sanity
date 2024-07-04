import {AddIcon} from '@sanity/icons'
import {Button, MenuItem} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {useBundles} from '../../store/bundles/BundlesProvider'
import {useVersion} from '../hooks/useVersion'
import {LATEST} from '../util/const'
import {BundleBadge} from './BundleBadge'
import {BundleMenu} from './BundleMenu'
import {CreateBundleDialog} from './dialog/CreateBundleDialog'

export function GlobalBundleMenu(): JSX.Element {
  const {data: bundles, loading} = useBundles()

  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  const {currentVersion, isDraft} = useVersion()

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
            <BundleBadge
              hue={currentVersion?.hue}
              icon={isDraft ? undefined : currentVersion?.icon}
              openButton
              padding={2}
              title={isDraft ? LATEST.title : currentVersion?.title}
            />
          </Button>
        }
        bundles={bundles}
        loading={loading}
        actions={
          // localize text
          <MenuItem icon={AddIcon} onClick={handleCreateBundleClick} text="Create release" />
        }
      />

      {createBundleDialogOpen && (
        <CreateBundleDialog onCancel={handleClose} onCreate={handleClose} />
      )}
    </>
  )
}
