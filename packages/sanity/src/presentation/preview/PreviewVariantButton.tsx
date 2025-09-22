import {UsersIcon} from '@sanity/icons'
import {Box, Select, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {DECISION_PARAMETERS_SCHEMA, useTranslation, useWorkspace} from 'sanity'

import {Button, Dialog, Tooltip} from '../../ui-components'
import {presentationLocaleNamespace} from '../i18n'

interface PreviewVariantButtonProps {
  currentSelections?: Record<string, string>
  onSelectionChange?: (selections: Record<string, string>) => void
}

/** @internal */
export function PreviewVariantButton({
  currentSelections = {},
  onSelectionChange,
}: PreviewVariantButtonProps): React.JSX.Element | null {
  const {t} = useTranslation(presentationLocaleNamespace)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pendingSelections, setPendingSelections] = useState<Record<string, string>>({})
  const workspace = useWorkspace()

  // Only render if DECISION_PARAMETERS_SCHEMA is configured
  const decideParametersConfig = workspace.__internal.options[DECISION_PARAMETERS_SCHEMA]
  if (!decideParametersConfig) {
    return null
  }

  // Filter and validate that each value is an array of strings
  const validParameters = Object.entries(decideParametersConfig).filter(([, value]) => {
    return Array.isArray(value) && value.every((item) => typeof item === 'string')
  }) as Array<[string, string[]]>

  const handleSelectionChange = (key: string, value: string) => {
    setPendingSelections(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    // Apply pending selections via callback
    onSelectionChange?.(pendingSelections)
    setIsDialogOpen(false)
  }

  const handleCancel = () => {
    // Reset pending selections and close dialog
    setPendingSelections({})
    setIsDialogOpen(false)
  }

  return (
    <>
      <Tooltip
        animate
        content={<Text size={1}>{t('preview-frame.variant-button.tooltip')}</Text>}
        fallbackPlacements={['bottom-start']}
        placement="bottom"
        portal
      >
        <Button
          data-testid="preview-variant-button"
          aria-label={t('preview-frame.variant-button.aria-label')}
          icon={UsersIcon}
          mode="bleed"
          onClick={() => {
            setPendingSelections(currentSelections)
            setIsDialogOpen(true)
          }}
          tooltipProps={null}
        />
      </Tooltip>

      {isDialogOpen && (
        <Dialog
          id="preview-variant-dialog"
          onClose={handleCancel}
          width={1}
          header={t('preview-frame.variant-dialog.title')}
          footer={{
            cancelButton: {
              onClick: handleCancel,
            },
            confirmButton: {
              text: 'View as...',
              onClick: handleSave,
            },
          }}
        >
          <Stack space={4}>
            <Text>{t('preview-frame.variant-dialog.body')}</Text>

            {validParameters.length > 0 ? (
              <Stack space={3}>
                {validParameters.map(([key, options]) => (
                  <Box key={key}>
                    <Text size={1} weight="medium" style={{marginBottom: 8}}>
                      {key}
                    </Text>
                    <Select
                      value={pendingSelections[key] || ''}
                      onChange={(event) => handleSelectionChange(key, event.currentTarget.value)}
                      placeholder={t('preview-frame.variant-dialog.select-placeholder', {key})}
                    >
                      <option value="">
                        {t('preview-frame.variant-dialog.select-placeholder', {key})}
                      </option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text muted>{t('preview-frame.variant-dialog.no-parameters')}</Text>
            )}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
