# Changelog

## v2.0

## Breaking (in some circumstances)

### No default aspect ratio anymore
The `container` option to calculateStyles is now optional. If not given, the image will be shown with the
aspect ratio from the cropped image. Also, the HotspotImage React component would prior to v2.0 use a default container aspect ration of 4/3 when
no `aspectRatio` props were passed to it.

So if you did this pre 2.0:
```js
<HotspotImage
  src={imageUrl}
  srcAspectRatio={imageAspectRatio}
  crop={crop}
  hotspot={hotspot}
  {/* look ma, no aspectRatio */}
/>
```
The image would be displayed with an aspect ratio of 4/3

In v2.0 and above, the image will be displayed with the aspect of the image (after the any cropping has been applied)
