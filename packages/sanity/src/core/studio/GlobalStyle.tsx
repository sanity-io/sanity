import {vars} from '@sanity/ui/css'
import {type ComponentType} from 'react'
import {createGlobalStyle, css} from 'styled-components'

import {useWorkspace} from './workspace'

export const GlobalStyle: ComponentType = () => {
  const {
    advancedVersionControl: {enabled: advancedVersionControlEnabled},
  } = useWorkspace()

  return <GlobalStyleSheet $documentEditorGutterEnabled={advancedVersionControlEnabled} />
}

interface Props {
  $documentEditorGutterEnabled: boolean
}

const GlobalStyleSheet = createGlobalStyle<Props>(({$documentEditorGutterEnabled}) => {
  return css`
    *::selection {
      background-color: color-mix(in srgb, transparent, ${vars.color.focusRing} 30%);
    }

    :root {
      --formGutterSize: ${$documentEditorGutterEnabled ? vars.space[4] : 0}px;
      --formGutterGap: ${$documentEditorGutterEnabled ? vars.space[3] : 0}px;
    }

    html {
      background-color: ${vars.color.bg};
    }

    body {
      scrollbar-gutter: stable;
    }

    #sanity {
      font-family: ${vars.font.text.family};
    }

    b {
      font-weight: ${vars.font.text.weight.medium};
    }

    strong {
      font-weight: ${vars.font.text.weight.medium};
    }
  `
})
