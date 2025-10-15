import {Box, Select, Text, TextInput} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {type DecisionParameter} from '../../core/config'
import {presentationLocaleNamespace} from '../i18n'

interface ParameterInputProps {
  paramKey: string
  paramConfig: DecisionParameter
  value: string
  onChange: (value: string) => void
}

/** @internal */
export function ParameterInput({
  paramKey,
  paramConfig,
  value,
  onChange,
}: ParameterInputProps): React.JSX.Element {
  const {t} = useTranslation(presentationLocaleNamespace)
  const displayTitle = paramConfig.title || paramKey
  const hasOptions = paramConfig.options && paramConfig.options.length > 0

  return (
    <Box>
      <Text size={1} weight="medium" style={{marginBottom: 8}}>
        {displayTitle}
      </Text>
      {hasOptions ? (
        <Select
          value={value || ''}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={t('preview-frame.variant-dialog.select-placeholder', {key: displayTitle})}
        >
          <option value="">
            {t('preview-frame.variant-dialog.select-placeholder', {key: displayTitle})}
          </option>
          {paramConfig.options?.map((option: {title: string; value: string} | string) => {
            const optionValue = typeof option === 'string' ? option : option.value
            const optionTitle = typeof option === 'string' ? option : option.title
            return (
              <option key={optionValue} value={optionValue}>
                {optionTitle}
              </option>
            )
          })}
        </Select>
      ) : (
        <TextInput
          value={value || ''}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={`Enter ${displayTitle.toLowerCase()}...`}
          type={paramConfig.type === 'number' ? 'number' : 'text'}
        />
      )}
    </Box>
  )
}