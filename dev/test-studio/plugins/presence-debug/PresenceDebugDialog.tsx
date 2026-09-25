import {Box, Button, Card, Dialog, Spinner, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {UserAvatar, useCurrentUser, usePresenceStore, useUserListWithPermissions} from 'sanity'
import {
  pathToString,
  type PresenceLocation,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {Flex, VStack} from 'ui5'

import {type PresenceDebugTarget} from './context'

interface PresenceDebugDialogProps {
  target: PresenceDebugTarget
  onClose: () => void
}

/** Lists the project's users; picking one shows them as present at the target */
export function PresenceDebugDialog(props: PresenceDebugDialogProps) {
  const {target, onClose} = props
  const presenceStore = usePresenceStore()
  const currentUser = useCurrentUser()
  const {data: users, loading} = useUserListWithPermissions({
    documentValue: null,
    permission: 'read',
  })
  const [placed, setPlaced] = useState<string[]>([])

  const location = useMemo(
    (): PresenceLocation =>
      target.location ?? {
        type: 'document',
        documentId: target.documentId,
        path: target.path,
        lastActiveAt: new Date().toISOString(),
      },
    [target],
  )

  const place = useCallback(
    (userId: string) => {
      presenceStore.debug.fakePresence(userId, [
        {...location, lastActiveAt: new Date().toISOString()},
      ])
      setPlaced((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
    },
    [location, presenceStore],
  )

  const clearAll = useCallback(() => {
    presenceStore.debug.removeFakePresence()
    setPlaced([])
  }, [presenceStore])

  const where = target.location
    ? `${pathToString(target.location.path)} (cursor)`
    : pathToString(target.path)

  return (
    <Dialog
      header="Fake presence here"
      id="presence-debug-dialog"
      onClose={onClose}
      width={0}
      footer={
        <Flex justifyContent="space-between" padding={2}>
          <Button fontSize={1} mode="ghost" text="Remove all" onClick={clearAll} />
          <Button fontSize={1} text="Done" tone="primary" onClick={onClose} />
        </Flex>
      }
    >
      <Flex padding={3} gap={3} flexDirection="column">
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1} muted>
            Present at{' '}
            <Text as="span" size={1} style={{fontFamily: 'monospace'}}>
              {where}
            </Text>
          </Text>
        </Card>

        {loading && (
          <Flex justifyContent="center" padding={3}>
            <Spinner muted />
          </Flex>
        )}

        {/* Keep the dialog short; the list scrolls when the project has many members */}
        <Box style={{maxHeight: 280, overflow: 'auto'}}>
          <VStack gap={1}>
            {(users ?? []).map((user) => {
              const isMe = user.id === currentUser?.id
              const isPlaced = placed.includes(user.id)
              return (
                <Button
                  key={user.id}
                  mode={isPlaced ? 'default' : 'bleed'}
                  tone={isPlaced ? 'positive' : 'default'}
                  onClick={() => place(user.id)}
                  padding={1}
                >
                  <Flex alignItems="center" gap={2}>
                    <UserAvatar user={user} size={0} />
                    <Box flex={1}>
                      <Text size={1} textOverflow="ellipsis">
                        {user.displayName}
                        {isMe ? ' (you)' : ''}
                      </Text>
                    </Box>
                    {isPlaced && (
                      <Text size={0} muted>
                        placed
                      </Text>
                    )}
                  </Flex>
                </Button>
              )
            })}
          </VStack>
        </Box>
      </Flex>
    </Dialog>
  )
}
