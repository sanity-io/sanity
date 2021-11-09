export default {
  title: 'Mux video post',
  name: 'muxVideoPost',
  type: 'document',
  fields: [
    {title: 'Title', name: 'title', type: 'string'},
    {
      title: 'Video file',
      name: 'video',
      type: 'mux.video',
    },
  ],
}
