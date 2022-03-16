import {InitialValueProperty, InitialValueResolver} from '@sanity/types'

// returns the "resolved" value from an initial value property (e.g. type.initialValue)
export async function resolveValue<Params, InitialValue>(
  initialValueOpt: InitialValueProperty<Params, InitialValue>,
  params?: Params
): Promise<InitialValue | undefined> {
  return typeof initialValueOpt === 'function'
    ? (initialValueOpt as InitialValueResolver<Params, InitialValue>)(params)
    : initialValueOpt
}
