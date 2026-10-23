import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties, type ReactNode} from 'react'
import {Flex} from 'ui5'

import {firstRow, space2Var, space3Var} from './FormEditRow.css'

export function FormEditRow({children}: {children: ReactNode}) {
  const {space} = useThemeV2()

  return (
    <Flex
      className={firstRow}
      paddingBottom={3}
      paddingTop={4}
      alignItems="flex-start"
      justifyContent="flex-start"
      flexWrap="wrap"
      style={
        {
          [space2Var]: `${space[2]}px`,
          [space3Var]: `${space[3]}px`,
        } as CSSProperties
      }
    >
      {children}
    </Flex>
  )
}
