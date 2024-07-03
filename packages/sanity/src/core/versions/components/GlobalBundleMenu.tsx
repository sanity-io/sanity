import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuItem, Text} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'
import {RelativeTime} from 'sanity'

import {
  VersionContext,
  type VersionContextValue,
} from '../../../_singletons/core/form/VersionContext'
import {useBundlesStore} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'
import {isDraftOrPublished} from '../util/dummyGetters'
import {CreateBundleDialog} from './dialog/CreateBundleDialog'
import {VersionBadge} from './VersionBadge'

export function GlobalBundleMenu(): JSX.Element {
  const {data: bundles, isLoading} = useBundlesStore()

  // eslint-disable-next-line no-warning-comments
  // FIXME REPLACE WHEN WE HAVE REAL DATA
  const {currentVersion, setCurrentVersion, isDraft} =
    useContext<VersionContextValue>(VersionContext)
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  const handleBundleChange = useCallback(
    (bundle: Partial<BundleDocument>) => () => {
      setCurrentVersion(bundle)
    },
    [setCurrentVersion],
  )

  /* create new bundle */

  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  return (
    <>
      <MenuButton
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
        id="global-version-menu"
        menu={
          <Menu>
            <MenuItem
              iconRight={isDraft ? <CheckmarkIcon /> : undefined}
              onClick={handleBundleChange(LATEST)}
              pressed={false}
              text={LATEST.title}
            />
            {bundles && bundles.length > 0 && (
              <>
                <MenuDivider />
              </>
            )}
            {bundles &&
              bundles
                .filter((b) => !isDraftOrPublished(b.name) || !b.archived)
                .map((b) => (
                  <MenuItem
                    key={b.name}
                    onClick={handleBundleChange(b)}
                    padding={1}
                    pressed={false}
                  >
                    <Flex>
                      <VersionBadge hue={b.hue} icon={b.icon} padding={2} />

                      <Box flex={1} padding={2} style={{minWidth: 100}}>
                        <Text size={1} weight="medium">
                          {b.title}
                        </Text>
                      </Box>

                      <Box padding={2}>
                        <Text muted size={1}>
                          {b.publishAt ? (
                            <RelativeTime time={b.publishAt as Date} useTemporalPhrase />
                          ) : (
                            /* localize text */
                            <span>{'No target date'}</span>
                          )}
                        </Text>
                      </Box>

                      <Box padding={2}>
                        <Text size={1}>
                          <CheckmarkIcon
                            style={{opacity: currentVersion.name === b.name ? 1 : 0}}
                          />
                        </Text>
                      </Box>
                    </Flex>
                  </MenuItem>
                ))}
            <MenuDivider />
            {/* localize text */}
            {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals */}
            <MenuItem icon={AddIcon} onClick={handleCreateBundleClick} text="Create release" />
          </Menu>
        }
        popover={{
          placement: 'bottom-start',
          portal: true,
          zOffset: 3000,
        }}
      />

      {createBundleDialogOpen && <CreateBundleDialog onClose={handleClose} />}
    </>
  )
}
