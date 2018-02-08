import VideoEmbedPreview from '../components/VideoEmbedPreview/VideoEmbedPreview'
import VideoEmbedInput from '../components/VideoEmbedInput'
import icon from 'react-icons/lib/fa/video-camera'

export default {
  type: 'object',
  name: 'videoEmbed',
  title: 'Video',
  icon,
  fields: [
    {
      name: 'service',
      type: 'string',
      title: 'Video service'
    },
    {
      name: 'id',
      type: 'string',
      title: 'Video id',
      description: 'Video id from service'
    }
  ],
  inputComponent: VideoEmbedInput,
  preview: {
    select: {
      id: 'id',
      service: 'service'
    },
    component: VideoEmbedPreview
  }
}
