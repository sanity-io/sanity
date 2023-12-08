import {useMemo} from 'react'
import {useTranslation} from './useTranslation'

/**
 * Enforces the shape of an object allowed to be passed into `useI18nText`.
 * @internal
 */
export type I18nNode<TNode extends {i18n?: {[TProp in string]: {key: string; ns: string}}}> = {
  i18n?: {[K in keyof TNode['i18n']]: {key: string; ns: string}}
} & {
  [K in keyof TNode['i18n']]: string
}

/**
 * A React hook for localizing strings in a given object (`node`) using the
 * `useTranslation` hook.
 *
 * This hook expects an object (`node`) with top-level keys associated with
 * string values. If an `i18n` property is present within the object, it should
 * contain localization configurations for each top-level key. Each
 * configuration must include a `key` and `ns` (namespace) used for the
 * translation of the corresponding string value.
 *
 * The hook uses a proxy to intercept access to properties of the `node`. For
 * properties defined in the `i18n` object, it returns the translated string
 * using the `t` function. If no translation is found, the original string value
 * is used as a fallback. For properties not defined in the `i18n` object, their
 * original values are returned.
 *
 * @param node - The object containing strings to be localized along with
 *  optional i18n configurations.
 * @returns A proxy of the original `node` object where each property access
 *  returns localized strings.
 * @internal
 */
export function useI18nText<TNode extends I18nNode<TNode>>(node: TNode): TNode {
  const namespaces = useMemo(() => {
    if (!node.i18n) return []
    return Array.from(new Set(Object.values(node.i18n).map(({ns}) => ns))).sort()
  }, [node.i18n])

  const {t} = useTranslation(namespaces)

  return useMemo(() => {
    const {i18n} = node
    if (!i18n) return node

    return new Proxy(node, {
      get: (target, property) => {
        const defaultValue = target[property as keyof TNode]

        if (typeof property === 'string' && property in i18n) {
          const {key, ns} = i18n[property as keyof TNode['i18n']]
          return t(key, {
            ns,
            // `defaultValue` is a special key in the i18next `t` API that
            // allows us to provide a fallback value if no translation is found
            // using the given key and namespace. if the value on the node
            // is a string, then we'll use that as the fallback value
            ...(typeof defaultValue === 'string' && {defaultValue}),
          })
        }

        return defaultValue
      },
    })
  }, [node, t])
}
