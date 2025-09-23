import {
  DECISION_PARAMETERS_SCHEMA,
  type StringInputProps,
  type TitledListValue,
  useFormValue,
  useWorkspace,
} from 'sanity'

const stringOperators: TitledListValue<string>[] = [
  {title: 'is equal to', value: 'equals'},
  {title: 'is not equal to', value: 'not-equals'},
  {title: 'contains', value: 'contains'},
  {title: 'does not contain', value: 'not-contains'},
  {title: 'is empty', value: 'is-empty'},
  {title: 'is not empty', value: 'is-not-empty'},
]

const numberOperators: TitledListValue<string>[] = [
  {title: 'is equal to', value: 'equals'},
  {title: 'is not equal to', value: 'not-equals'},
  {title: 'is empty', value: 'is-empty'},
  {title: 'is not empty', value: 'is-not-empty'},
  {title: 'is greater than', value: '>'},
  {title: 'is less than', value: '<'},
  {title: 'is greater than or equal to', value: '>='},
  {title: 'is less than or equal to', value: '<='},
]

/**
 * Custom input component for operator selection that reads from sanity.config and
 * returns a list of operators according to the property type
 */
export function OperatorSelectInput(props: StringInputProps) {
  const propertyValue = useFormValue(props.path.slice(0, -1).concat('property')) as string
  const decisionParametersConfig = useWorkspace().__internal.options[DECISION_PARAMETERS_SCHEMA]
  const decisionParameters = decisionParametersConfig ? decisionParametersConfig() : undefined
  const propertyType = decisionParameters?.[propertyValue]?.type
  const operators = propertyType === 'number' ? numberOperators : stringOperators

  return props.renderDefault({
    ...props,
    schemaType: {
      ...props.schemaType,
      options: {
        list: operators,
      },
    },
  })
}
