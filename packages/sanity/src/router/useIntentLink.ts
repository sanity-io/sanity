import {useMemo} from 'react'
import {IntentParameters} from './types'
import {useLink} from './useLink'
import {useRouter} from './useRouter'
import {compileSearchParams} from './compileSearchParams'

/**
 * @public
 */
export interface UseIntentLinkOptions {
  /**
   * The name of the intent to trigger.
   */
  intent: string

  /**
   * An optional click event handler.
   */
  onClick?: React.MouseEventHandler<HTMLElement>

  /**
   * Optional parameters to pass to the intent. See {@link IntentParameters}
   */
  params?: IntentParameters

  /**
   * Whether to replace the current URL in the browser history.
   */
  replace?: boolean

  /**
   * @internal
   */
  searchParams?: Record<string, string | undefined>

  /**
   * The target window or frame to open the link in.
   */
  target?: string
}

/**
 *
 * Returns props for an anchor element that will trigger an intent when clicked.
 *
 * @example
 * ```tsx
 * const {onClick, href} = useIntentLink({
 *   intent: 'edit',
 *   params: {id: 'foo'}
 * })
 *
 * <a href={href} onClick={onClick}>Link to "foo" editor</a>
 * ```
 *
 * @public
 *
 * @param options - Options to use for the link
 *  {@link UseIntentLinkOptions}
 *
 * @returns - An object with `onClick` and `href` props to use for the link
 */
export function useIntentLink(options: UseIntentLinkOptions): {
  onClick: React.MouseEventHandler<HTMLElement>
  href: string
} {
  const {intent, onClick: onClickProp, params, replace, searchParams, target} = options
  const {resolveIntentLink} = useRouter()

  const href = useMemo(() => {
    const path = resolveIntentLink(intent, params)
    const search = compileSearchParams(searchParams)

    return `${path}${search || ''}`
  }, [intent, searchParams, params, resolveIntentLink])

  const {onClick} = useLink({href, onClick: onClickProp, replace, target})

  return {onClick, href}
}
