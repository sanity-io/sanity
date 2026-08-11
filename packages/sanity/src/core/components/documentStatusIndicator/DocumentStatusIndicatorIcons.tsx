import {type RefAttributes, type SVGProps} from 'react'

type IconProps = SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>

/**
 * Filled rhombus used to mark that a document exists in the selected variant.
 * Path sourced from Studio Patterns Figma (`rhombus-full`).
 */
export function VariantStatusIcon(props: IconProps) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="rhombus"
      width="0.5rem"
      height="0.5rem"
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
      ref={ref}
    >
      <path
        d="M3.57691 0.152304C3.77999 -0.0507683 4.10923 -0.050768 4.3123 0.152305L7.73691 3.57691C7.93999 3.77999 7.93999 4.10923 7.73691 4.3123L4.3123 7.73691C4.10923 7.93999 3.77999 7.93999 3.57691 7.73691L0.152304 4.3123C-0.0507683 4.10923 -0.050768 3.77999 0.152305 3.57691L3.57691 0.152304Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Solid circle marking a published document. Path sourced from Studio Patterns Figma.
 */
export function PublishedStatusIcon(props: IconProps) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="published"
      data-testid="document-status-dot-published"
      width="7"
      height="7"
      viewBox="0 0 7 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
      ref={ref}
    >
      <circle cx="3.5" cy="3.5" r="3.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Stroked circle marking a draft. Path sourced from Studio Patterns Figma.
 */
export function DraftStatusIcon(props: IconProps) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="draft"
      data-testid="document-status-dot-draft"
      width="7"
      height="7"
      viewBox="0 0 7 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
      ref={ref}
    >
      <circle cx="3.5" cy="3.5" r="2.9" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  )
}
