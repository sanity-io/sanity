import {useToast} from '@sanity/ui'
import {useEffect} from 'react'

import {definePlugin, type LayoutProps} from '../config'

function SchedulePublishingStudioLayout(props: LayoutProps) {
  const toast = useToast()
  useEffect(() => {
    console.error(
      `Scheduled publishing plugin is added by default, please remove this plugin from your config. 
        \nIf you have a custom date config, you can use the scheduledPublishing API to customize the date input.
        \nSee: https://www.sanity.io/docs/scheduled-publishing.
        `,
    )
    toast.push({
      id: 'scheduled-publishing-deprecated',
      closable: true,
      duration: 60000,
      status: 'error',
      title: 'Scheduled publishing plugin is deprecated',
      description:
        'The scheduled publishing plugin is now deprecated, you should remove the plugin from your configuration. If you have a custom date config, you can use the scheduledPublishing API to customize the date input. See: https://www.sanity.io/docs/scheduled-publishing.',
    })
  }, [toast])

  return props.renderDefault(props)
}

/**
 * Shows an error in console and a toast to prevent users from importing the deprecated plugin.
 * Gives information about how to upgrade to the new version.
 */
export const deprecatedScheduledPublishingPlugin = definePlugin({
  name: 'sanity/deprecated/scheduled-publishing',
  studio: {
    components: {
      layout: SchedulePublishingStudioLayout,
    },
  },
})
