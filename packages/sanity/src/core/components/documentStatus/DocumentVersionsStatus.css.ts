import {css} from '#styled-system/css'

export const titleStack = css({
  minWidth: 0,
  width: '100%',
})

export const updatedAtText = css({
  flex: 'none',
  whiteSpace: 'nowrap',
})

export const versionStatusItem = css({
  '&&': {
    padding: '2px 0',
  },
})

/**
 * A row's vertical padding — `versionStatusItem`'s 2px plus the `paddingY={2}` inside it — is what
 * separates the rows from each other, but on the first and last row it lands on the tooltip's edge
 * and stacks on the padding the tooltip card already applies. Pull those 10px back off the outer
 * edges so the content is inset by the card's padding alone, like every other studio tooltip's is.
 * Keep in step with the two paddings it cancels.
 */
export const versionList = css({
  marginBlock: '-10px',
})
