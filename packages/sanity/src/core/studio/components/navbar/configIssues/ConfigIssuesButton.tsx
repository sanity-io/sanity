/* eslint-disable i18next/no-literal-string */
import {WarningOutlineIcon} from '@sanity/icons'
import {Card, Stack, Text} from '@sanity/ui'
import {useCallback, useId, useState} from 'react'

import {Dialog} from '../../../../../ui-components'
import {StatusButton} from '../../../../components'
import {getCollectedConfigWarnings} from '../../../../config/configWarnings'
import {useSchema} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {useColorSchemeValue} from '../../../colorScheme'
import {SchemaProblemGroups} from '../../../screens/schemaErrors/SchemaProblemGroups'

export function ConfigIssuesButton() {
  const schema = useSchema()
  const groupsWithWarnings =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'warning'),
    ) || []

  const configWarnings = getCollectedConfigWarnings()
  const totalWarnings = groupsWithWarnings.length + configWarnings.length

  // get root scheme
  const scheme = useColorSchemeValue()
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

  if (totalWarnings === 0) {
    return null
  }

  return (
    <>
      <StatusButton
        icon={WarningOutlineIcon}
        mode="bleed"
        onClick={handleOpen}
        ref={setButtonElement}
        selected={isDialogOpen}
        tone="caution"
        aria-label={t('configuration-issues.button.label')}
        tooltipProps={{scheme, content: t('configuration-issues.button.tooltip')}}
      />

      {isDialogOpen && (
        <Dialog
          header="Configuration issues"
          width={2}
          onClickOutside={handleClose}
          onClose={handleClose}
          // force root scheme here to "break out" of the navbar's dark scheme
          scheme={scheme}
          id={dialogId}
        >
          <Stack space={4}>
            <Stack space={3}>
              <Text as="h2" size={1} weight="medium">
                Found {totalWarnings} configuration warning{totalWarnings === 1 ? '' : 's'}
              </Text>{' '}
              <Text muted size={1}>
                Configuration checks are only performed during development and will not be visible
                in production builds
              </Text>
            </Stack>

            {configWarnings.length > 0 && (
              <Stack space={3}>
                {configWarnings.map((warning, index) => (
                  <Card
                    key={`${warning.type}-${warning.projectId}-${index}`}
                    padding={3}
                    radius={2}
                    shadow={1}
                    tone="caution"
                  >
                    <Stack space={2}>
                      <Text size={1} weight="medium">
                        Divergent auth config
                      </Text>
                      <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
                        {warning.message}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}

            {groupsWithWarnings.length > 0 && (
              <SchemaProblemGroups problemGroups={groupsWithWarnings} />
            )}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
