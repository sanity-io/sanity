import {UsersIcon} from '@sanity/icons'
import {Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {DECISION_PARAMETERS_SCHEMA, useTranslation, useWorkspace} from 'sanity'

import {type DecisionParameter} from '../../config'
import {Button, Dialog, Tooltip} from '../../ui-components'
import {presentationLocaleNamespace} from '../i18n'
import {ParameterInput} from './ParameterInput'

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

  // Get decision parameters from the config function
  const decisionParameters = decideParametersConfig ? decideParametersConfig() : undefined
  const validParameters = decisionParameters ? Object.entries(decisionParameters) : []

  const handleSelectionChange = (key: string, value: string) => {
    setPendingSelections((prev) => ({
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
                {validParameters.map(([key, paramConfig]: [string, DecisionParameter]) => (
                  <ParameterInput
                    key={key}
                    paramKey={key}
                    paramConfig={paramConfig}
                    value={pendingSelections[key] || ''}
                    onChange={(value) => handleSelectionChange(key, value)}
                  />
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
