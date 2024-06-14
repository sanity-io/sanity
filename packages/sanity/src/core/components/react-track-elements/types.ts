/** @internal */
export type Reported<Value> = [string, Value]

/** @internal */
export type ReporterHook<Payload> = (
  id: string | null,
  value: () => Payload,
  isEqual?: IsEqualFunction<Payload>,
) => void

/** @internal */
export type IsEqualFunction<Value> = (a: Value | null, b: Value | null) => boolean
