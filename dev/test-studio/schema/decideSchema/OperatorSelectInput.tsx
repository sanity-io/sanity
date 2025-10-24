import {
  DECISION_PARAMETERS_SCHEMA,
  type StringInputProps,
  type TitledListValue,
  useFormValue,
  useWorkspace,
} from 'sanity'

const stringOperators: TitledListValue<string>[] = [
  {title: 'is equal to', value: 'eq'},
  {title: 'is not equal to', value: 'neq'},
  {title: 'is empty', value: 'empty'},
  {title: 'is not empty', value: 'nempty'},
  {title: 'contains', value: 'contains'},
  {title: 'does not contain', value: 'ncontains'},
]

const numberOperators: TitledListValue<string>[] = [
  {title: 'is equal to', value: 'eq'},
  {title: 'is not equal to', value: 'neq'},
  {title: 'is empty', value: 'empty'},
  {title: 'is not empty', value: 'nempty'},
  {title: 'is greater than', value: 'gt'},
  {title: 'is less than', value: 'lt'},
  {title: 'is greater than or equal to', value: 'gte'},
  {title: 'is less than or equal to', value: 'lte'},
]

/**
 * Custom input component for operator selection that reads from sanity.config and
 * returns a list of operators according to the property type
 */
export function OperatorSelectInput(props: StringInputProps) {
  const propertyValue = useFormValue(props.path.slice(0, -1).concat('attr')) as string
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
