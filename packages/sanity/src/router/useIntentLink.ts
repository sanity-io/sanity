import {IntentParameters} from './types'
import {useLink} from './useLink'
import {useRouter} from './useRouter'

/**
 *
 * @example
 * ```tsx
 * import {useIntentLink} from 'sanity'
 *
 * const {handleClick, href} = useIntentLink({
 *   intent: 'edit',
 *   params: {id: 'foo'}
 * })
 *
 * <a href={href} onClick={handleClick}>Link to "foo" editor</a>
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
  handleClick: React.MouseEventHandler<HTMLElement>
  href: string
} {
  const {intent, onClick, params, replace, target} = props
  const {resolveIntentLink} = useRouter()
  const href = resolveIntentLink(intent, params)
  const {handleClick} = useLink({href, onClick, replace, target})

  return {handleClick, href}
}
