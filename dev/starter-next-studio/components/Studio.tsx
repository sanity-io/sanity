/* eslint-disable react/react-in-jsx-scope */

import {useMemo} from 'react'
import {createConfig, Studio} from 'sanity'
import {deskTool} from 'sanity/desk'

const wrapperStyles = {height: '100vh', width: '100vw'}

export default function StudioRoot({basePath}: {basePath: string}) {
  const config = useMemo(
    () =>
      createConfig({
        basePath,
        plugins: [deskTool()],
        title: 'Next.js Starter',
        projectId: 'ppsg7ml5',
        dataset: 'test',
        schema: {
          types: [
            {
              type: 'document',
              name: 'post',
              title: 'Post',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
          ],
        },
      }),
    [basePath]
  )

  return (
    <div style={wrapperStyles}>
      <Studio config={config} />
    </div>
  )
}
