import {DECISION_PARAMETERS_SCHEMA} from '../../config'
import {useWorkspace} from '../../studio/workspace'
import {type StringInputProps} from '../../form/types'
import {type TitledListValue} from '@sanity/types'

/**
 * Custom input component for property selection that reads from sanity.config and
 * returns a list of properties with their titles
 */
export function PropertySelectInput(props: StringInputProps) {
  const decisionParametersConfig = useWorkspace().__internal.options[DECISION_PARAMETERS_SCHEMA]
  const decisionParameters = decisionParametersConfig ? decisionParametersConfig() : undefined

  const properties = decisionParameters ? Object.keys(decisionParameters) : []

  const optionsList = properties
    .map((property) => {
      const decisionParameter = decisionParameters?.[property]
      if (!decisionParameter) {
        return null
      }
      return {
        title: decisionParameter.title || property,
        value: property,
      }
    })
    .filter(Boolean) as TitledListValue<string>[]

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        list: optionsList,
      },
    },
  })
}