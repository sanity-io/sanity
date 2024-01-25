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

const TRIAL_EXPERIENCE_CLIENT: Partial<ClientConfig> = {
  dataset: 'staging',
  projectId: 'pyrmmpch',
  useCdn: true,
}

export const useCommentsUpsellData = (enabled: boolean): CommentsUpsellData | null => {
  const [data, setData] = useState<CommentsUpsellData | null>(null)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const fetchCommentsUpsellData = useCallback(async () => {
    // TODO: Is there a better way to handle this? credentials are required in localhost but not in *
    const isLocalhost = window.location.origin.startsWith('http://localhost:3333')
    const trialExperienceClient = client.withConfig({
      ...TRIAL_EXPERIENCE_CLIENT,
      withCredentials: isLocalhost,
    })

    const res = await trialExperienceClient.fetch(QUERY)
    setData(res)
  }, [client])

  useEffect(() => {
    // Avoid fetching if the modal or panel won't be shown.
    if (!enabled) return

    fetchCommentsUpsellData()
  }, [enabled, fetchCommentsUpsellData])

  return data
}
