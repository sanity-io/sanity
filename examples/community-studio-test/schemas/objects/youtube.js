import React from 'react'
import YouTubePreview from '../components/YouTubePreview';

const icon = () => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width="1em" height="1em">
      <path d='M490.24,113.92c-13.888-24.704-28.96-29.248-59.648-30.976C399.936,80.864,322.848,80,256.064,80 c-66.912,0-144.032,0.864-174.656,2.912c-30.624,1.76-45.728,6.272-59.744,31.008C7.36,138.592,0,181.088,0,255.904 C0,255.968,0,256,0,256c0,0.064,0,0.096,0,0.096v0.064c0,74.496,7.36,117.312,21.664,141.728 c14.016,24.704,29.088,29.184,59.712,31.264C112.032,430.944,189.152,432,256.064,432c66.784,0,143.872-1.056,174.56-2.816 c30.688-2.08,45.76-6.56,59.648-31.264C504.704,373.504,512,330.688,512,256.192c0,0,0-0.096,0-0.16c0,0,0-0.064,0-0.096 C512,181.088,504.704,138.592,490.24,113.92z M192,352V160l160,96L192,352z' />
  </svg>
)

export default {
  name: 'youtube',
  title: 'YouTube embed',
  type: 'object',
  icon,
  fields: [
    {
      name: 'url',
      title: 'URL of the video',
      description: "Paste in the URL and we'll figure out the rest",
      type: 'url',
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {
      url: 'url'
    },
    component: YouTubePreview
  }
};
