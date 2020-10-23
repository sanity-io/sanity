export default {
  name: 'sanity.imagePalette',
  title: 'Image palette',
  type: 'object',
  fields: [
    {name: 'darkMuted', type: 'sanity.imagePaletteSwatch', title: 'Dark Muted'},
    {name: 'lightVibrant', type: 'sanity.imagePaletteSwatch', title: 'Light Vibrant'},
    {name: 'darkVibrant', type: 'sanity.imagePaletteSwatch', title: 'Dark Vibrant'},
    {name: 'vibrant', type: 'sanity.imagePaletteSwatch', title: 'Vibrant'},
    {name: 'dominant', type: 'sanity.imagePaletteSwatch', title: 'Dominant'},
    {name: 'lightMuted', type: 'sanity.imagePaletteSwatch', title: 'Light Muted'},
    {name: 'muted', type: 'sanity.imagePaletteSwatch', title: 'Muted'},
  ],
}
