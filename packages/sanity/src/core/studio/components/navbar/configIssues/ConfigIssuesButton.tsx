import React, {useCallback, useState, useId} from 'react'
import {Dialog, Heading, Stack, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {useSchema} from '../../../../hooks'
import {SchemaProblemGroups} from '../../../screens/schemaErrors/SchemaProblemGroups'
import {useColorScheme} from '../../../colorScheme'
import {StatusButton} from '../../../../components'

export function ConfigIssuesButton() {
  const schema = useSchema()
  const groupsWithWarnings =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'warning'),
    ) || []

  // get root scheme
  const {scheme} = useColorScheme()

  const dialogId = useId()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const handleOpen = useCallback(() => setDialogOpen(true), [])

  const handleClose = useCallback(() => {
    setDialogOpen(false)

    if (buttonElement) {
      buttonElement.focus()
    }
  }, [buttonElement])

  if (groupsWithWarnings.length === 0) {
    return null
  }

  return (
    <>
      <StatusButton
        icon={WarningOutlineIcon}
        label="Found configuration issues"
        mode="bleed"
        onClick={handleOpen}
        ref={setButtonElement}
        selected={isDialogOpen}
        tone="caution"
        tooltip={{scheme}}
      />

      {isDialogOpen && (
        <Dialog
          header={
            <Stack space={3}>
              <Text weight="semibold">Configuration issues</Text>
              <Text muted size={1}>
                Configuration checks are only performed during development and will not be visible
                in production builds
              </Text>
            </Stack>
          }
          width={2}
          onClickOutside={handleClose}
          onClose={handleClose}
          // force root scheme here to "break out" of the navbar's dark scheme
          scheme={scheme}
          id={dialogId}
        >
          <Stack space={4} padding={4}>
            <Heading as="h2" size={1}>
              Found {groupsWithWarnings.length} schema warnings
            </Heading>
            <SchemaProblemGroups problemGroups={groupsWithWarnings} />
          </Stack>
        </Dialog>
      )}
    </>
  )
}
