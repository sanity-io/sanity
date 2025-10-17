import {useEffect} from 'react'
import {
  DECISION_PARAMETERS_SCHEMA,
  set,
  type StringInputProps,
  useFormValue,
  useWorkspace,
} from 'sanity'

/**
 * Custom input component for target value that reads from sanity.config and
 * returns a list of target values with their titles or a plain string input
 */
export function ValueTypeInput(props: StringInputProps) {
  const {onChange} = props
  const propertyValue = useFormValue(props.path.slice(0, -1).concat('attr')) as string
  const valueTypeFormValue = useFormValue(props.path.slice(0, -1).concat('type')) as string
  const decisionParametersConfig = useWorkspace().__internal.options[DECISION_PARAMETERS_SCHEMA]
  const decisionParameters = decisionParametersConfig ? decisionParametersConfig() : undefined
  const valueType = decisionParameters?.[propertyValue]?.type || 'string'

  useEffect(() => {
    if (valueType !== valueTypeFormValue) {
      onChange(set(valueType))
    }
  }, [valueType, valueTypeFormValue, onChange])

  return props.renderDefault({
    ...props,
  })
}
