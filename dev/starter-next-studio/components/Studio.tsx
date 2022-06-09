/* eslint-disable react/react-in-jsx-scope */

import {useMemo} from 'react'
import {createConfig, Studio} from 'sanity'
import {deskTool} from 'sanity/desk'

export default function StudioRoot({basePath}: {basePath: string}) {
  const config = useMemo(
    () =>
      createConfig({
        basePath,
        plugins: [deskTool()],
        name: 'Next.js Starter',
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
    <div style={{height: '100vh', width: '100vw'}}>
      <Studio config={config} />
    </div>
  )
}
