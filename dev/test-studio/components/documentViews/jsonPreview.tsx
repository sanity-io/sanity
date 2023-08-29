import { ClipboardIcon, LaunchIcon, MobileDeviceIcon, UndoIcon } from '@sanity/icons'
import {Card, Code, Flex, Tooltip, useToast, Text, Button} from '@sanity/ui'
import React, { useRef } from 'react' 
import { IframeSizeKey, SizeProps } from 'sanity-plugin-iframe-pane'

export function JSONPreviewDocumentView(props: any) {
  return (
    <Card padding={4} sizing="border" style={{minHeight: '100%'}} tone="transparent">
      <Toolbar setIframeSize={() => console.log('setloading')} handleReload={() => console.log('h')} ></Toolbar>
      <Code language="json">{JSON.stringify(props.document.displayed, null, 2)}</Code>
    </Card>
  
  )
}




export const sizes: SizeProps = {
  desktop: {
    width: '100%',
    height: '100%',
  },
  mobile: {
    width: 414,
    height: 746,
  },
}

export const DEFAULT_SIZE = `desktop`

export interface ToolbarProps {
  displayUrl?: string
  iframeSize?: IframeSizeKey
  setIframeSize: (size: IframeSizeKey) => void
  reloading?: boolean
  reloadButton?: boolean
  handleReload: () => void
}
export function Toolbar(props: ToolbarProps) {
  const {
    displayUrl = 'sdkfhshjfn',
    iframeSize = 'mobile',
    setIframeSize,
    reloading = false,
    reloadButton = true,
    handleReload,
  } = props

  const input = useRef<HTMLTextAreaElement>(null)
  const {push: pushToast} = useToast()




  return (
    <>
      <textarea
        style={{position: `absolute`, pointerEvents: `none`, opacity: 0}}
        ref={input}
        value={displayUrl}
        readOnly
        tabIndex={-1}
      />
      <Card padding={2} borderBottom>
        <Flex align="center" gap={2}>
          <Flex id='flexbox' align="center" gap={1}>
            <Tooltip
            placement='left'
            boundaryElement={document.getElementById('flexbox')}
            fallbackPlacements={['bottom-end']}
              content={
                <Text size={1} style={{whiteSpace: 'nowrap'}}>
                  {iframeSize === 'mobile' ? 'Exit mobile preview' : 'Preview mobile viewport'}
                </Text>
              }
              padding={2}
            >
              <Button
                disabled={!displayUrl}
                fontSize={[1]}
                padding={2}
                mode={iframeSize === 'mobile' ? 'default' : 'ghost'}
                icon={MobileDeviceIcon}
                onClick={() => setIframeSize(iframeSize === 'mobile' ? 'desktop' : 'mobile')}
              />
            </Tooltip>
          </Flex>

          <Flex align="center" gap={1}>
            {reloadButton ? (
              <Tooltip
                content={
                  <Text size={1} style={{whiteSpace: 'nowrap'}}>
                    {reloading ? 'Reloading…' : 'Reload'}
                  </Text>
                }
                padding={2}
              >
                <Button
                  disabled={!displayUrl}
                  mode="bleed"
                  fontSize={[1]}
                  padding={2}
                  icon={<UndoIcon style={{transform: 'rotate(90deg) scaleY(-1)'}} />}
                  loading={reloading}
                  aria-label="Reload"
                  onClick={() => handleReload()}
                />
              </Tooltip>
            ) : null}
            <Tooltip
              content={
                <Text size={1} style={{whiteSpace: 'nowrap'}}>
                  Copy URL
                </Text>
              }
              padding={2}
            >
              <Button
                mode="bleed"
                disabled={!displayUrl}
                fontSize={[1]}
                icon={ClipboardIcon}
                padding={[2]}
                aria-label="Copy URL"
                onClick={() => {
                  if (!input?.current?.value) return


                  pushToast({
                    closable: true,
                    status: 'success',
                    title: 'The URL is copied to the clipboard',
                  })
                }}
              />
            </Tooltip>
            <Tooltip
             placement='top'
             fallbackPlacements={['bottom-end']}
              content={
                <Text size={1} style={{whiteSpace: 'nowrap'}}>
                  Open URL in a new tab
                </Text>
              }
              padding={2}
            >
              <Button
                disabled={!displayUrl}
                fontSize={[1]}
                icon={LaunchIcon}
                mode="ghost"
                paddingY={[2]}
                text="Open"
                aria-label="Open URL in a new tab"
                onClick={() => window.open(displayUrl)}
              />
            </Tooltip>
          </Flex>
        </Flex>
      </Card>
    </>
  )
}