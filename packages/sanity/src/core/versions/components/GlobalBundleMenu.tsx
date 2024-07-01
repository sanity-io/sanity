import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuItem, Text} from '@sanity/ui'
import {useCallback, useContext, useState} from 'react'
import {useRouter} from 'sanity/router'

import {
  VersionContext,
  type VersionContextValue,
} from '../../../_singletons/core/form/VersionContext'
import {type Bundle, type Version} from '../types'
import {BUNDLES, LATEST} from '../util/const'
import {isDraftOrPublished} from '../util/dummyGetters'
import {CreateBundleDialog} from './dialog/CreateBundleDialog'
import {VersionBadge} from './VersionBadge'

export function GlobalBundleMenu(): JSX.Element {
  const router = useRouter()

  // eslint-disable-next-line no-warning-comments
  // FIXME REPLACE WHEN WE HAVE REAL DATA
  const bundles = BUNDLES

  // eslint-disable-next-line no-warning-comments
  // FIXME REPLACE WHEN WE HAVE REAL DATA
  const {currentVersion, setCurrentVersion, isDraft} =
    useContext<VersionContextValue>(VersionContext)
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  const handleBundleChange = useCallback(
    (bundle: Version) => () => {
      const {name} = bundle

      if (isDraftOrPublished(name)) {
        router.navigateStickyParam('perspective', '')
      } else {
        router.navigateStickyParam('perspective', `bundle.${name}`)
      }

      setCurrentVersion(bundle)
    },
    [router, setCurrentVersion],
  )

  /* create new bundle */

  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleCancel = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  const handleSubmit = useCallback(
    () => (value: Bundle) => {
      // eslint-disable-next-line no-console
      console.log('create new bundle', value.name)

      setCreateBundleDialogOpen(false)
    },
    [],
  )

  return (
    <>
      <MenuButton
        button={
          <Button mode="bleed" padding={0} radius="full">
            <VersionBadge
              tone={currentVersion?.tone}
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
            {bundles.length > 0 && (
              <>
                <MenuDivider />
              </>
            )}
            {bundles
              .filter((b) => !isDraftOrPublished(b.name))
              .map((b) => (
                <MenuItem key={b.name} onClick={handleBundleChange(b)} padding={1} pressed={false}>
                  <Flex>
                    <VersionBadge tone={b.tone} icon={b.icon} padding={2} />

                    <Box flex={1} padding={2} style={{minWidth: 100}}>
                      <Text size={1} weight="medium">
                        {b.title}
                      </Text>
                    </Box>

                    <Box padding={2}>
                      <Text muted size={1}>
                        {b.publishAt ? `a date will be here ${b.publishAt}` : 'No target date'}
                      </Text>
                    </Box>

                    <Box padding={2}>
                      <Text size={1}>
                        <CheckmarkIcon style={{opacity: currentVersion.name === b.name ? 1 : 0}} />
                      </Text>
                    </Box>
                  </Flex>
                </MenuItem>
              ))}
            <MenuDivider />
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

      {createBundleDialogOpen && (
        <CreateBundleDialog onCancel={handleCancel} onSubmit={handleSubmit} />
      )}
    </>
  )
}
