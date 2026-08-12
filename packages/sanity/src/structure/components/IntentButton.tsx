import {type ComponentProps, type ReactNode, type Ref, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {Button, type ButtonProps} from '../../ui-components/button/Button'
import {type PaneMenuItem} from '../types'

type RouterIntent = NonNullable<PaneMenuItem['intent']>

export function IntentButton(
  props: {
    intent: RouterIntent
    ref?: Ref<HTMLButtonElement>
  } & ButtonProps &
    Omit<ComponentProps<typeof Button>, 'as' | 'href' | 'type'>,
) {
  const {intent, ref, ...restProps} = props

  const Link = useMemo(() => {
    function LinkComponent(linkProps: {children?: ReactNode; ref?: Ref<HTMLAnchorElement>}) {
      const {ref: linkRef, ...rest} = linkProps
      return (
        <IntentLink
          {...rest}
          intent={intent.type}
          params={intent.params}
          ref={linkRef}
          searchParams={intent.searchParams}
        />
      )
    }
    // oxlint-disable-next-line react/react-compiler -- displayName assignment on render-local component
    LinkComponent.displayName = 'Link'
    return LinkComponent
  }, [intent])

  return props.disabled ? (
    <Button {...restProps} disabled aria-disabled="true" />
  ) : (
    <Button {...restProps} as={Link} data-as="a" ref={ref} />
  )
}
