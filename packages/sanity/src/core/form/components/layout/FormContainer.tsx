import {getTheme_v2} from '@sanity/ui/theme'
import {type ComponentProps, type ComponentType} from 'react'
import {css, styled} from 'styled-components'

import {useFormGutterEnabled} from '../../hooks/useFormGutterEnabled'
import {formGutterCustomProperties} from './formGutterCustomProperties'

/**
 * @internal
 */
export const FormContainer: ComponentType<ComponentProps<typeof FormContainerRoot>> = (props) => {
  const gutterEnabled = useFormGutterEnabled()
  return <FormContainerRoot {...props} data-gutter={gutterEnabled ? 'true' : undefined} />
}

const FormContainerRoot = styled.div((props) => {
  const {space, container} = getTheme_v2(props.theme)

  return css`
    ${formGutterCustomProperties(props.theme)}

    box-sizing: border-box;
    margin-inline: auto;
    padding-inline: ${space[4]}px;
    padding-block-start: ${space[5]}px;
    padding-block-end: ${space[9]}px;
    max-width: calc(${container[1]}px + (var(--formGutterSize) * 2) + (var(--formGutterGap) * 2));
  `
})
