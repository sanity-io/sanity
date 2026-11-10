import {useContext, type ComponentType, type PropsWithChildren, type ReactNode} from 'react'
import {FormRowGutterSuppressedContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {useFormGutterEnabled} from '../../hooks/useFormGutterEnabled'
import {FormCell} from './FormCell'
import {formGutterCustomProperties} from './formGutterCustomProperties'

const areas = ['gutterStart', 'body', 'gutterEnd'] as const
export type FormArea = (typeof areas)[number]

export interface FormRowProps extends PropsWithChildren {
  gutterStartCell?: ReactNode
}

/**
 * Turn the variant gutter off for the rows rendered directly inside. A row
 * opts back in for its own descendants, so an object field's children keep
 * their gutter. Document forms leave this unset.
 *
 * @internal
 */
export function SuppressFormRowGutter(props: {children: ReactNode}) {
  return (
    <FormRowGutterSuppressedContext.Provider value={true}>
      {props.children}
    </FormRowGutterSuppressedContext.Provider>
  )
}

/**
 * @internal
 */
export const FormRow: ComponentType<FormRowProps> = ({children, gutterStartCell}) => {
  const gutterSuppressed = useContext(FormRowGutterSuppressedContext)
  const gutterEnabled = useFormGutterEnabled() && !gutterSuppressed

  return (
    <FormRowGutterSuppressedContext.Provider value={false}>
      <FormRowContainer data-ui="FormRow" data-gutter={gutterEnabled ? 'true' : undefined}>
        {gutterStartCell && <FormCell $area="gutterStart">{gutterStartCell}</FormCell>}
        <FormCell $area="body">{children}</FormCell>
      </FormRowContainer>
    </FormRowGutterSuppressedContext.Provider>
  )
}

const FormRowContainer = styled.div(
  (props) => css`
    ${formGutterCustomProperties(props.theme)}

    display: grid;
    grid-template-areas: '${areas.join(' ')}';
    grid-template-columns: var(--formGutterSize) 1fr var(--formGutterSize);
    gap: var(--formGutterGap);

    /* Collapse the end gutter and gap for nested rows. */
    & & {
      grid-template-columns: var(--formGutterSize) 1fr 0;
      margin-inline-end: calc(var(--formGutterGap) * -1);
    }
  `,
)
