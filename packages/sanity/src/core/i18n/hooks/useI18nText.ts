import {useMemo} from 'react'
import {useTranslation} from './useTranslation'

export type I18nNode<TNode extends {i18n?: {[TProp in string]: {key: string; ns: string}}}> = {
  i18n?: {[K in keyof TNode['i18n']]: {key: string; ns: string}}
} & {
  [K in keyof TNode['i18n']]: string
}

/** @internal */
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
