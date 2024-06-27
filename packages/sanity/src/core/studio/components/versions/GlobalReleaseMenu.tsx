import {AddIcon, CheckmarkIcon} from '@sanity/icons'
import {Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuItem, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useRouter} from 'sanity/router'

import {BUNDLES, LATEST, type Version} from '../../../util/versions/util'
import {ReleaseIcon} from './ReleaseIcon'

export function GlobalReleaseMenu(): JSX.Element {
  const router = useRouter()

  // eslint-disable-next-line no-warning-comments
  // FIXME REPLACE WHEN WE HAVE REAL DATA
  const releases = BUNDLES

  // eslint-disable-next-line no-warning-comments
  // FIXME REPLACE WHEN WE HAVE REAL DATA
  const [currentRelease, setCurrentRelease] = useState(releases[0])
  const [createReleaseDialogOpen, setCreateReleaseDialogOpen] = useState(false)

  const isDraft = currentRelease?.name === 'draft'

  const handleBundleChange = useCallback(
    (bundle: Version) => () => {
      const {name} = bundle

      if (name === 'drafts') {
        router.navigateStickyParam('perspective', '')
      } else {
        router.navigateStickyParam('perspective', `bundle.${name}`)
      }

      setCurrentRelease(bundle)
    },
    [router],
  )

  const handleGoToLatest = useCallback(
    () => () => {
      router.navigateStickyParam('perspective', '')

      setCurrentRelease(LATEST)
    },
    [router],
  )

  /* create new bundle */

  const handleCreateReleaseClick = useCallback(() => {
    setCreateReleaseDialogOpen(true)
  }, [])

  const handleCancel = useCallback(() => {
    setCreateReleaseDialogOpen(false)
  }, [])

  const handleSubmit = useCallback((value: Version) => {
    setCreateReleaseDialogOpen(false)

    // eslint-disable-next-line no-console
    console.log('create new bundle', value.name)
  }, [])

  return (
    <>
      <MenuButton
        button={
          <Button mode="bleed" padding={0} radius="full">
            <ReleaseIcon
              hue={currentRelease?.hue}
              icon={isDraft ? undefined : currentRelease?.icon}
              openButton
              padding={2}
              // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
              title={isDraft ? 'Latest' : currentRelease?.title}
            />
          </Button>
        }
        id="global-version-menu"
        menu={
          <Menu>
            <MenuItem
              iconRight={isDraft ? <CheckmarkIcon /> : undefined}
              onClick={handleGoToLatest()}
              pressed={false}
              // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
              text="Latest"
            />
            {releases.length > 0 && (
              <>
                <MenuDivider />
              </>
            )}
            {releases
              .filter((r) => r.name !== 'draft')
              .map((r) => (
                <MenuItem key={r.name} onClick={handleBundleChange(r)} padding={1} pressed={false}>
                  <Flex>
                    <ReleaseIcon hue={r.hue} icon={r.icon} padding={2} />

                    <Box flex={1} padding={2} style={{minWidth: 100}}>
                      <Text size={1} weight="medium">
                        {r.name === 'draft' ? 'Latest' : r.title}
                      </Text>
                    </Box>

                    <Box padding={2}>
                      <Text muted size={1}>
                        {r.publishAt ? `a date will be here ${r.publishAt}` : 'No target date'}
                      </Text>
                    </Box>

                    <Box padding={2}>
                      <Text size={1}>
                        <CheckmarkIcon style={{opacity: currentRelease.name === r.name ? 1 : 0}} />
                      </Text>
                    </Box>
                  </Flex>
                </MenuItem>
              ))}
            <MenuDivider />
            {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals */}
            <MenuItem icon={AddIcon} onClick={handleCreateReleaseClick} text="Create release" />
          </Menu>
        }
        popover={{
          placement: 'bottom-start',
          portal: true,
          zOffset: 3000,
        }}
      />

      {createReleaseDialogOpen &&
        {
          /*<CreateReleaseDialog onCancel={handleCancel} onSubmit={handleSubmit} />*/
        }}
    </>
  )
}
