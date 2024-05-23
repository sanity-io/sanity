import {Studio} from 'sanity'

import config from '../sanity.config'

const wrapperStyles = {height: '100vh', width: '100vw'}

export default function StudioRoot({basePath}: {basePath: string}) {
  return (
    <div style={wrapperStyles}>
      <Studio config={{...config, basePath}} />
    </div>
  )
}
