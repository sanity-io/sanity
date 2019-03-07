import sanityClient from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// We're connecting to
const client = sanityClient({
  projectId: '3do82whm',
  dataset: 'production',
  useCdn: true
})

const query = `
  *[_id == 'dashboardFeed-v1'] {
    items[]-> {
      _id,
      title,
      poster,
      youtubeURL,
      "presenter": authors[0]-> {name, mugshot, bio},
      guideOrTutorial-> {
        title,
        slug,
        "presenter": authors[0]-> {name, mugshot, bio},
        _createdAt
      }
    }
  }[0]
`

export default {
  getFeed: () => client.observable.fetch(query),
  urlBuilder: imageUrlBuilder(client)
}
