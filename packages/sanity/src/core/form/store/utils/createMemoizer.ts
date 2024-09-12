import {type Path} from '@sanity/types'
import {toString} from '@sanity/util/paths'

export type FunctionDecorator<TFunction extends (...args: never[]) => unknown> = (
  fn: TFunction,
) => TFunction

export interface MemoizerOptions<TFunction extends (...args: never[]) => unknown> {
  getPath: (...args: Parameters<TFunction>) => Path
  hashInput: (...args: Parameters<TFunction>) => unknown
  decorator: ((fn: TFunction) => TFunction) | undefined
}

function identity<T>(t: T) {
  return t
}

export function createMemoizer<TFunction extends (...args: never[]) => unknown>({
  getPath,
  hashInput,
  decorator = identity,
}: MemoizerOptions<TFunction>): FunctionDecorator<TFunction> {
  const cache = new Map<string, {serializedHash: string; result: ReturnType<TFunction>}>()

  return (fn) => {
    const memoizedFn = ((...args: Parameters<TFunction>) => {
      const path = toString(getPath(...args))
      const hashed = hashInput(...args)
      const serializedHash = JSON.stringify(hashed)
      const cached = cache.get(path)
      if (serializedHash === cached?.serializedHash) return cached.result

      // if (cached) {
      //   console.log({
      //     name: fn.name,
      //     path,
      //     // reason: objectDiff(JSON.parse(cached.serializedHash), hashed).join(', '),
      //     prev: JSON.parse(cached.serializedHash),
      //     next: hashed,
      //   })
      // }

      const result = fn(...args) as ReturnType<TFunction>
      cache.set(path, {serializedHash, result})

      return result
    }) as TFunction

    return decorator(memoizedFn)
  }
}
