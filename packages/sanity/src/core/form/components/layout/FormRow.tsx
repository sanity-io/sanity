import {type ComponentType, type PropsWithChildren, type ReactNode} from 'react'
import {styled} from 'styled-components'

import {FormCell} from './FormCell'

const areas = ['gutterStart', 'body', 'gutterEnd'] as const
export type FormArea = (typeof areas)[number]

export interface FormRowProps extends PropsWithChildren {
  gutterStartCell?: ReactNode
}

/**
 * @internal
 */
export const FormRow: ComponentType<FormRowProps> = ({children, gutterStartCell}) => (
  <FormRowContainer>
    {gutterStartCell && <FormCell $area="gutterStart">{gutterStartCell}</FormCell>}
    <FormCell $area="body">{children}</FormCell>
  </FormRowContainer>
)

const FormRowContainer = styled.div`
  display: grid;
  grid-template-areas: '${areas.join(' ')}';
  grid-template-columns: var(--formGutterSize, 0px) 1fr var(--formGutterSize, 0px);
  gap: var(--formGutterGap, 0px);

  /* Collapse the end gutter and gap for nested rows. */
  & & {
    grid-template-columns: var(--formGutterSize, 0px) 1fr 0;
    margin-inline-end: calc(var(--formGutterGap, 0px) * -1);
  }
`
