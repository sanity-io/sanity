import {type ComponentType, type PropsWithChildren, type ReactNode} from 'react'
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
 * @internal
 */
export const FormRow: ComponentType<FormRowProps> = ({children, gutterStartCell}) => {
  const gutterEnabled = useFormGutterEnabled()

  return (
    <FormRowContainer data-ui="FormRow" data-gutter={gutterEnabled ? 'true' : undefined}>
      {gutterStartCell && <FormCell $area="gutterStart">{gutterStartCell}</FormCell>}
      <FormCell $area="body">{children}</FormCell>
    </FormRowContainer>
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
