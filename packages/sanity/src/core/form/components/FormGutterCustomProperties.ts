import {styled, css} from 'styled-components'

interface Props {
  $enabled: boolean
}

/**
 * @internal
 */
export const FormGutterCustomProperties = styled.div<Props>(({$enabled}) => {
  return css`
    display: contents;
    --formGutterEnabled: ${$enabled ? 1 : 0};
  `
})
