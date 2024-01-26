import {useCallback, useEffect, useState} from 'react'
import {ClientConfig} from '@sanity/client'
import {CommentsUpsellData} from '../types'
import {useClient, DEFAULT_STUDIO_CLIENT_OPTIONS} from 'sanity'

const QUERY = `*[_type == "commentsUpsell"]{
    ...,
   image {
       asset-> { url, altText }
     },
     descriptionText[]{
       ...,
       _type == "iconAndText" => {
         ...,
         icon {
           "url": asset->.url
         }
       },
       _type == "block" => {
         ...,
           children[] {
             ...,
             _type == "inlineIcon" => {
               icon {"url": asset->.url}
             }
         }
       }
     }
 }[0]`

const UPSELL_CLIENT: Partial<ClientConfig> = {
  dataset: 'upsell-public-development', // TODO: Update for production when ready
  projectId: 'pyrmmpch',
  withCredentials: false,
  useCdn: true,
}

export const useCommentsUpsellData = (enabled: boolean): CommentsUpsellData | null => {
  const [data, setData] = useState<CommentsUpsellData | null>(null)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const fetchCommentsUpsellData = useCallback(async () => {
    const res = await client.withConfig(UPSELL_CLIENT).fetch(QUERY)
    setData(res)
  }, [client])

  useEffect(() => {
    // Avoid fetching if the modal or panel won't be shown.
    if (!enabled) return

    fetchCommentsUpsellData()
  }, [enabled, fetchCommentsUpsellData])

  return data
}
