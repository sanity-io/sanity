import React, {useCallback, useState, useId} from 'react'
import {Dialog, Heading, Stack, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {useSchema} from '../../../../hooks'
import {SchemaProblemGroups} from '../../../screens/schemaErrors/SchemaProblemGroups'
import {useColorScheme} from '../../../colorScheme'
import {StatusButton} from '../../../../components'
import {useTranslation} from '../../../../i18n'

export function ConfigIssuesButton() {
  const schema = useSchema()
  const groupsWithWarnings =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'warning'),
    ) || []

  // get root scheme
  const {scheme} = useColorScheme()
  const {t} = useTranslation()

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
        label={t('navbar.configuration.error.found-configuration-issues-status')}
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
              <Text weight="semibold">
                {t('navbar.configuration.error.configuration-issues-title')}
              </Text>
              <Text muted size={1}>
                {t('navbar.configuration.error.configuration-issues-description')}
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
              {t('navbar.configuration.found-number-schema-warning', {
                count: groupsWithWarnings.length,
              })}
            </Heading>
            <SchemaProblemGroups problemGroups={groupsWithWarnings} />
          </Stack>
        </Dialog>
      )}
    </>
  )
}
