import {Box, Card, Dialog, DialogProps, MenuDivider, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import type {Changelog} from '@sanity/base/_internal'
import {ChangelogList} from './ChangelogList'

interface ChangelogDialogProps {
  changelog: Changelog
  currentVersion: string
  dialogProps: Omit<DialogProps, 'id'>
  latestVersion: string
}

const StickyBox = styled(Box)`
  position: sticky;
  top: 0;
  z-index: 1;
`

export function ChangelogDialog(props: ChangelogDialogProps) {
  const {changelog, currentVersion, dialogProps, latestVersion} = props

  const changelogWithChangeItems = (changelog || []).filter((c) => c?.changeItems?.length > 0)
  const hasChangelog = changelogWithChangeItems.length > 0

  return (
    <Dialog header="Upgrade the Sanity Studio" width={1} {...dialogProps} id="changelog-dialog">
      <>
        <StickyBox>
          <Card padding={4} borderBottom={hasChangelog}>
            <Stack space={4}>
              <Stack space={3}>
                {hasChangelog && <Text weight="semibold">Changelog</Text>}
                <Text muted size={1}>
                  Your Sanity Studio version <code>{currentVersion}</code>. The latest version is{' '}
                  <code>{latestVersion}</code>.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </StickyBox>

        {hasChangelog && (
          <Stack space={5} paddingY={4}>
            {changelogWithChangeItems?.map((log, index) => {
              const {changeItems, version} = log
              const showDivider = index < changelogWithChangeItems.length - 1
              const isLatest = version === latestVersion

              return (
                <React.Fragment key={version}>
                  <Box paddingX={4}>
                    <ChangelogList
                      changeItems={changeItems}
                      version={version}
                      isLatest={isLatest}
                    />
                  </Box>
                  {showDivider && <MenuDivider />}
                </React.Fragment>
              )
            })}
          </Stack>
        )}
      </>
    </Dialog>
  )
}
