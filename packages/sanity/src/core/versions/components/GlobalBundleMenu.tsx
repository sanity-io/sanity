import {AddIcon} from '@sanity/icons'
import {Button, MenuItem} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'

import {
  VersionContext,
  type VersionContextValue,
} from '../../../_singletons/core/form/VersionContext'
import {useBundlesStore} from '../../store/bundles'
import {LATEST} from '../util/const'
import {BundleMenu} from './BundleMenu'
import {CreateBundleDialog} from './dialog/CreateBundleDialog'
import {VersionBadge} from './VersionBadge'

export function GlobalBundleMenu(): JSX.Element {
  const {data: bundles, loading} = useBundlesStore()

  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  // eslint-disable-next-line no-warning-comments
  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {currentVersion, isDraft} = useContext<VersionContextValue>(VersionContext)

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
            <VersionBadge
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
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          <MenuItem icon={AddIcon} onClick={handleCreateBundleClick} text="Create release" />
        }
      />

      {createBundleDialogOpen && <CreateBundleDialog onClose={handleClose} />}
    </>
  )
}
