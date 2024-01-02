import {useMemo} from 'react'
import {defineConfig, Studio} from 'sanity'
import {structureTool} from 'sanity/structure'

const wrapperStyles = {height: '100vh', width: '100vw'}

export default function StudioRoot({basePath}: {basePath: string}) {
  const config = useMemo(
    () =>
      defineConfig({
        basePath,
        plugins: [structureTool()],
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
    [basePath],
  )

  return (
    <div style={wrapperStyles}>
      <Studio config={config} />
    </div>
  )
}
