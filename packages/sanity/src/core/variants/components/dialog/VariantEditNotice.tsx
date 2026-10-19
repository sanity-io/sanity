import {createContext, type ReactNode, useContext} from 'react'

import {type SystemVariant} from '../../types'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * A slot in the shipped Edit variant dialog, above the form, for a notice about what the change affects (for example
 * "N documents are affected"). The host provides a component; the default renders nothing, so Studio is unchanged
 * unless a provider is mounted.
 *
 * @internal
 */
export type VariantEditNoticeComponent = (props: {variant: SystemVariant}) => ReactNode

const noNotice: VariantEditNoticeComponent = () => null

const VariantEditNoticeContext = createContext<VariantEditNoticeComponent>(noNotice)

/** @internal Provide a (stable) component that renders the notice for a variant. */
export const VariantEditNoticeProvider = VariantEditNoticeContext.Provider

/** @internal */
export function VariantEditNotice(props: {variant: SystemVariant}): ReactNode {
  const Notice = useContext(VariantEditNoticeContext)
  return <Notice variant={props.variant} />
}
