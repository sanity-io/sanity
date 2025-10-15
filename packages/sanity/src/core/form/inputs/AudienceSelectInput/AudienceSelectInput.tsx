import {Box, Select} from '@sanity/ui'
import {useMemo} from 'react'

import {DECISION_PARAMETERS_SCHEMA} from '../../../config'
import {useTranslation} from '../../../i18n'
import {useWorkspace} from '../../../studio/workspace'
import {set, unset} from '../../patch'
import {type StringInputProps} from '../../types'

/**
 * Custom input component for audience selection that reads from sanity.config
 * Used internally by defineLocalDecideField for audience condition selection
 *
 * @internal
 */
export function AudienceSelectInput(props: StringInputProps) {
  const {value, onChange} = props
  const {t} = useTranslation()
  const workspace = useWorkspace()
  const decisionParametersConfig = workspace.__internal.options[DECISION_PARAMETERS_SCHEMA]

  // Resolve options from sanity.config decision parameters
  // This component should be used with a specific parameter key from the config
  const audiences = useMemo(() => {
    if (decisionParametersConfig) {
      const config = decisionParametersConfig()
      // Find the first parameter that has options (could be audience or any other parameter)
      // In practice, this should be made more specific by the field configuration
      const paramWithOptions = Object.values(config).find(param => param.options)

      if (paramWithOptions?.options) {
        return paramWithOptions.options.map((option) =>
          typeof option === 'string' ? option : option.value
        )
      }
    }

    return []
  }, [decisionParametersConfig])

  const handleChange = (selectedValue: string) => {
    if (selectedValue) {
      onChange(set(selectedValue))
    } else {
      onChange(unset())
    }
  }

  return (
    <Box>
      <Select
        value={value || ''}
        onChange={(event) => handleChange(event.currentTarget.value)}
        placeholder={t('form.input.audience-select.placeholder')}
      >
        <option value="">{t('form.input.audience-select.placeholder')}</option>
        {audiences.map((audience: string) => (
          <option key={audience} value={audience}>
            {audience}
          </option>
        ))}
      </Select>
    </Box>
  )
}
