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

  // Resolve audiences from sanity.config
  const audiences = useMemo(() => {
    if (decisionParametersConfig && decisionParametersConfig.audiences) {
      return decisionParametersConfig.audiences
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
