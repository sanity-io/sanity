/**
 * TODO: Remove once the API call is implemented
 */
export const studioAnnouncementQuery = `*[_type == "productAnnouncement"] | order(publishedDate desc) {
    ...,
    body[]{
       ...,
        _type == "imageBlock" => {
            ...,
            "image": {
                "url": image.asset->.url
            }
         },
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
 }`
