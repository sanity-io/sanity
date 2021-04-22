import {InitialValueParams, InitialValueProperty, InitialValueResolver} from '@sanity/types'

// returns the "resolved" value from an initial value property (e.g. type.initialValue)
export async function resolveValue<InitialValue>(
  initialValueOpt: InitialValueProperty<InitialValue>,
  params?: InitialValueParams
): Promise<InitialValue | undefined> {
  return typeof initialValueOpt === 'function'
    ? (initialValueOpt as InitialValueResolver<InitialValue>)(params)
    : initialValueOpt
}
