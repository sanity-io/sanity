import {useMemo} from 'react'
import {IntentParameters} from './types'
import {useLink} from './useLink'
import {useRouter} from './useRouter'

/**
 *
 * @example
 * ```tsx
 * import {useIntentLink} from 'sanity'
 *
 * const {onClick, href} = useIntentLink({
 *   intent: 'edit',
 *   params: {id: 'foo'}
 * })
 *
 * <a href={href} onClick={onClick}>Link to "foo" editor</a>
 * ```
 *
 * @public
 */
export function useIntentLink(props: {
  intent: string
  onClick?: React.MouseEventHandler<HTMLElement>
  params?: IntentParameters
  replace?: boolean
  target?: string
}): {
  onClick: React.MouseEventHandler<HTMLElement>
  href: string
} {
  const {intent, onClick: onClickProp, params, replace, target} = props
  const {resolveIntentLink} = useRouter()
  const href = useMemo(() => resolveIntentLink(intent, params), [intent, params, resolveIntentLink])
  const {onClick} = useLink({href, onClick: onClickProp, replace, target})

  return {onClick, href}
}
