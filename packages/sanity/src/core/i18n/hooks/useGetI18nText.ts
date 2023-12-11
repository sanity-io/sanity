import {useCallback, useMemo} from 'react'
import {isNonNullable} from '../../util'
import {useTranslation} from './useTranslation'
import type {I18nNode} from './useI18nText'

/**
 * Similar to `useI18nText` except returns a function that can be called
 * conditionally.
 * @internal
 */
export function useGetI18nText<TNode extends I18nNode<TNode>>(
  input: TNode | undefined | Array<TNode | undefined>,
): (node: TNode) => TNode {
  const items = Array.isArray(input) ? input : [input]
  const stableNamespaces = JSON.stringify(
    items
      .flatMap((item) => (item?.i18n ? Object.values(item.i18n).map(({ns}) => ns) : []))
      .filter(isNonNullable)
      .sort(),
  )
  const namespaces = useMemo(() => JSON.parse(stableNamespaces), [stableNamespaces])
  const {t} = useTranslation(namespaces)

  return useCallback(
    function getI18nText(node: TNode) {
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
    },
    [t],
  )
}
