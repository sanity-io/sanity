import {DECISION_PARAMETERS_SCHEMA, type StringInputProps, useFormValue, useWorkspace} from 'sanity'

/**
 * Custom input component for target value that reads from sanity.config and
 * returns a list of target values with their titles or a plain string input
 */
export function TargetValueInput(props: StringInputProps) {
  const propertyValue = useFormValue(props.path.slice(0, -1).concat('attr')) as string
  const decisionParametersConfig = useWorkspace().__internal.options[DECISION_PARAMETERS_SCHEMA]
  const decisionParameters = decisionParametersConfig ? decisionParametersConfig() : undefined
  const targetValues = decisionParameters?.[propertyValue]?.options

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: targetValues
        ? {
            list: targetValues,
          }
        : undefined,
    },
  })
}
