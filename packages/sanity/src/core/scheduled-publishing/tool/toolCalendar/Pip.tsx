import {gray, red} from '@sanity/color'
import {Box} from '@sanity/ui'

interface Props {
  mode?: 'default' | 'failed'
  selected?: boolean
}
const Pip = (props: Props) => {
  const {mode = 'default', selected} = props
  return (
    <Box
      style={{
        ...(mode === 'default'
          ? {
              background: gray[selected ? 100 : 300].hex,
            }
          : {}),
        ...(mode === 'failed'
          ? {
              background: red[500].hex,
            }
          : {}),
        borderRadius: '2px',
        height: '2px',
        width: '100%',
      }}
    />
  )
}

export default Pip
