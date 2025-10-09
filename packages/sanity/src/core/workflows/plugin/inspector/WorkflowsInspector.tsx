import {
  CheckmarkIcon,
  ChevronRightIcon,
  ClockIcon,
  EditIcon,
  PublishIcon,
  RobotIcon,
  TranslateIcon,
  UserIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import {Avatar, Badge, Box, Button, Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {styled} from 'styled-components'

const Root = styled(Card)({
  position: 'relative',
  zIndex: '1',
  lineHeight: '0',
})

const TimelineContainer = styled(Stack)({
  'position': 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '18px',
    top: '0',
    bottom: '0',
    width: '2px',
    background: 'var(--card-border-color)',
  },
})

const StageCard = styled(Card)<{$status: 'completed' | 'current' | 'pending' | 'rejected'}>(
  ({$status}) => ({
    position: 'relative',
    borderLeft: `3px solid ${
      $status === 'completed'
        ? 'var(--card-badge-positive-fg-color)'
        : $status === 'current'
          ? 'var(--card-badge-caution-fg-color)'
          : $status === 'rejected'
            ? 'var(--card-badge-critical-fg-color)'
            : 'var(--card-badge-muted-fg-color)'
    }`,
  }),
)

const WorkflowCard = styled(Card)({
  'cursor': 'pointer',
  'transition': 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
})

const IconContainer = styled.div({
  fontSize: 12,
})

interface WorkflowStage {
  id: string
  title: string
  status: 'completed' | 'current' | 'pending' | 'rejected'
  trigger: {
    type: 'user' | 'webhook' | 'system' | 'schedule'
    name: string
    avatar?: string
  }
  timestamp: string
  duration?: string
  details?: {
    notes?: string
    assignee?: string
    deadline?: string
    priority?: 'low' | 'medium' | 'high'
  }
  icon: React.ComponentType
}

interface Workflow {
  id: string
  name: string
  type: string
  currentStage: string
  status: 'active' | 'completed' | 'paused' | 'failed'
  progress: number
  assignee?: {
    name: string
    avatar: string
  }
  deadline?: string
  stages: WorkflowStage[]
}

// Mock workflow data
const contentPublishingStages: WorkflowStage[] = [
  {
    id: 'draft',
    title: 'Draft Created',
    status: 'completed',
    trigger: {
      type: 'user',
      name: 'Sarah Chen',
      avatar: 'SC',
    },
    timestamp: '2024-10-07 09:15',
    duration: '2 days',
    details: {
      notes: 'Initial article draft about Q4 product updates',
      priority: 'medium',
    },
    icon: EditIcon,
  },
  {
    id: 'review',
    title: 'Content Review',
    status: 'completed',
    trigger: {
      type: 'user',
      name: 'Mike Rodriguez',
      avatar: 'MR',
    },
    timestamp: '2024-10-08 14:30',
    duration: '1 day',
    details: {
      notes: 'Reviewed for accuracy and brand guidelines. Made minor corrections.',
      assignee: 'Mike Rodriguez',
    },
    icon: CheckmarkIcon,
  },
  {
    id: 'translation',
    title: 'Translation',
    status: 'completed',
    trigger: {
      type: 'webhook',
      name: 'Lokalise Integration',
    },
    timestamp: '2025-10-09 10:45',
    duration: '4 hours',
    details: {
      notes: 'Automated translation to Spanish, French, and German',
    },
    icon: TranslateIcon,
  },
  {
    id: 'approval',
    title: 'Editorial Approval',
    status: 'current',
    trigger: {
      type: 'user',
      name: 'Lisa Park',
      avatar: 'LP',
    },
    timestamp: '2025-10-09 16:20',
    details: {
      assignee: 'Lisa Park',
      deadline: '2024-10-10 17:00',
      priority: 'high',
      notes: 'Final editorial review before publication',
    },
    icon: UserIcon,
  },
  {
    id: 'scheduling',
    title: 'Publication Scheduling',
    status: 'pending',
    trigger: {
      type: 'schedule',
      name: 'Auto-scheduler',
    },
    timestamp: 'Pending approval',
    details: {
      notes: 'Scheduled for optimal engagement time',
    },
    icon: ClockIcon,
  },
  {
    id: 'publish',
    title: 'Published',
    status: 'pending',
    trigger: {
      type: 'system',
      name: 'Publishing System',
    },
    timestamp: 'Scheduled for 2024-10-10 12:00',
    details: {
      notes: 'Will be published to main website and social channels',
    },
    icon: PublishIcon,
  },
]

const legalReviewStages: WorkflowStage[] = [
  {
    id: 'submission',
    title: 'Legal Review Requested',
    status: 'completed',
    trigger: {
      type: 'user',
      name: 'Sarah Chen',
      avatar: 'SC',
    },
    timestamp: '2024-10-08 11:30',
    duration: '30 minutes',
    details: {
      notes: 'Submitted content for legal compliance review',
      priority: 'high',
    },
    icon: EditIcon,
  },
  {
    id: 'review',
    title: 'Legal Analysis',
    status: 'current',
    trigger: {
      type: 'user',
      name: 'David Kim',
      avatar: 'DK',
    },
    timestamp: '2025-10-09 09:00',
    details: {
      assignee: 'David Kim',
      deadline: '2025-10-11 17:00',
      priority: 'high',
      notes: 'Reviewing for compliance with data protection regulations',
    },
    icon: UserIcon,
  },
  {
    id: 'approval',
    title: 'Legal Approval',
    status: 'pending',
    trigger: {
      type: 'user',
      name: 'David Kim',
    },
    timestamp: 'Pending review',
    details: {
      notes: 'Final legal sign-off required',
    },
    icon: CheckmarkIcon,
  },
]

const mockWorkflows: Workflow[] = [
  {
    id: 'content-publishing',
    name: 'Content Publishing',
    type: 'Editorial',
    currentStage: 'Editorial Approval',
    status: 'active',
    progress: 60,
    assignee: {
      name: 'Lisa Park',
      avatar: 'LP',
    },
    // deadline: '2024-10-10 17:00',
    stages: contentPublishingStages,
  },
  {
    id: 'legal-review',
    name: 'Legal Review',
    type: 'Compliance',
    currentStage: 'Legal Analysis',
    status: 'active',
    progress: 40,
    assignee: {
      name: 'David Kim',
      avatar: 'DK',
    },
    // deadline: 'In 3 days',
    stages: legalReviewStages,
  },
  {
    id: 'marketing-approval',
    name: 'Marketing Approval',
    type: 'Brand',
    currentStage: 'Brand Review',
    status: 'paused',
    progress: 25,
    assignee: {
      name: 'Emma Watson',
      avatar: 'EW',
    },
    // deadline: '2024-10-12 12:00',
    stages: [
      {
        id: 'brand-check',
        title: 'Brand Guidelines Check',
        status: 'completed',
        trigger: {type: 'system', name: 'Auto-checker'},
        timestamp: '2025-10-09 15:30',
        duration: '5 minutes',
        icon: CheckmarkIcon,
      },
      {
        id: 'brand-review',
        title: 'Brand Review',
        status: 'pending',
        trigger: {type: 'user', name: 'Emma Watson', avatar: 'EW'},
        timestamp: 'On hold',
        details: {notes: 'Waiting for brand manager availability'},
        icon: UserIcon,
      },
    ],
  },
]

function WorkflowsInspectorHeader({
  selectedWorkflow,
  onBack,
}: {
  selectedWorkflow?: Workflow
  onBack?: () => void
}) {
  return (
    <Root>
      <Flex align="center" gap={1} paddingY={3} paddingX={2}>
        <Button
          padding={2}
          mode="bleed"
          as={selectedWorkflow && onBack ? 'button' : 'div'}
          onClick={selectedWorkflow && onBack ? onBack : undefined}
        >
          <Text as={selectedWorkflow ? 'span' : 'h1'} size={1} weight="medium">
            {'Workflows'}
          </Text>
        </Button>
        {selectedWorkflow && (
          <Flex gap={2} align="center">
            <Text size={1}>
              <ChevronRightIcon />
            </Text>
            <WorkflowTitleBadge mode="outline" tone="suggest">
              {selectedWorkflow.name}
            </WorkflowTitleBadge>
          </Flex>
        )}
      </Flex>
    </Root>
  )
}

const WorkflowTitleBadge = styled(Badge)`
  padding: 6px 6px;
  span {
    font-size: 13px;
  }
`
const StatusBadge = styled(Badge)`
  padding: 6px 6px;
  span {
    font-size: 11px;
  }
`

const ProgressBar = styled.div<{$progress: number; $muted: boolean}>(({$progress, $muted}) => ({
  'width': '100%',
  'height': '4px',
  'backgroundColor': 'var(--card-muted-bg-color)',
  'borderRadius': '2px',
  'overflow': 'hidden',
  '&::after': {
    content: '""',
    display: 'block',
    width: `${$progress}%`,
    height: '100%',
    backgroundColor: `${$muted ? 'lightgray' : 'var(--card-badge-suggest-fg-color)'}`,
    transition: 'width 0.3s ease',
  },
}))

function WorkflowListItem({workflow, onClick}: {workflow: Workflow; onClick: () => void}) {
  const getStatusBadge = (status: Workflow['status']) => {
    const config = {
      active: {tone: 'suggest', text: 'Active'},
      completed: {tone: 'positive', text: 'Completed'},
      paused: {tone: 'default', text: 'Paused'},
      failed: {tone: 'critical', text: 'Failed'},
    }[status] as {tone: any; text: string}

    return <StatusBadge tone={config.tone}>{config.text}</StatusBadge>
  }

  return (
    <WorkflowCard padding={3} radius={3} border onClick={onClick}>
      <Stack space={3}>
        <Flex align="center" justify="space-between">
          <Text size={2} weight="semibold">
            {workflow.name}
          </Text>
          {getStatusBadge(workflow.status)}
        </Flex>

        <Flex align="center" justify="space-between">
          <Text size={1} muted>
            {'Current stage:'}
          </Text>
          <Text size={1} weight="medium">
            {workflow.currentStage}
          </Text>
        </Flex>

        {workflow.assignee && (
          <Flex align="center" gap={2}>
            <Text size={1} muted>
              {'Assignee:'}
            </Text>
            <Avatar size={0} initials={workflow.assignee.avatar} />
            <Text size={1}>{workflow.assignee.name}</Text>
          </Flex>
        )}

        {workflow.deadline && (
          <Flex align="center" gap={2}>
            <ClockIcon />
            <Text size={1} muted>
              {'Due:'}
            </Text>
            <Text size={1}>{workflow.deadline}</Text>
          </Flex>
        )}

        <Stack space={2}>
          <Flex align="center" justify="space-between">
            <Text size={1} muted>
              {'Progress'}
            </Text>
            <Text size={1} weight="medium">
              {`${workflow.progress}%`}
            </Text>
          </Flex>
          <ProgressBar $progress={workflow.progress} $muted={workflow.status === 'paused'} />
        </Stack>

        <Flex align="center" justify="space-between">
          <Text size={1} muted>
            {`${workflow.stages.filter((s) => s.status === 'completed').length} of ${workflow.stages.length} stages completed`}
          </Text>
          <ChevronRightIcon style={{fontSize: 14, opacity: 0.5}} />
        </Flex>
      </Stack>
    </WorkflowCard>
  )
}

function WorkflowStageItem({stage}: {stage: WorkflowStage}) {
  const getStatusBadge = (status: WorkflowStage['status']) => {
    const tone = {
      completed: 'positive',
      current: 'caution',
      pending: 'default',
      rejected: 'critical',
    }[status] as any
    const text = {
      completed: 'Completed',
      current: 'In Progress',
      pending: 'Pending',
      rejected: 'Rejected',
    }[status]
    return <StatusBadge tone={tone}>{text}</StatusBadge>
  }

  const getTriggerIcon = (type: WorkflowStage['trigger']['type']) => {
    switch (type) {
      case 'webhook':
        return <RobotIcon />
      case 'system':
        return <RobotIcon />
      case 'schedule':
        return <ClockIcon />
      default:
        return <UserIcon />
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'critical'
      case 'medium':
        return 'caution'
      case 'low':
        return 'positive'
      default:
        return 'default'
    }
  }

  return (
    <StageCard $status={stage.status} padding={3} radius={3} border>
      <Stack space={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <Text size={1}>
            {stage.status === 'current' ? (
              <Spinner size={1} />
            ) : (
              <IconContainer>
                <stage.icon />
              </IconContainer>
            )}
          </Text>
          <Text size={1} weight="semibold">
            {stage.title}
          </Text>
          <Box style={{marginLeft: 'auto'}}>{getStatusBadge(stage.status)}</Box>
        </Flex>

        <Flex align="center" gap={2}>
          <Box style={{fontSize: 14, opacity: 0.7}}>{getTriggerIcon(stage.trigger.type)}</Box>
          <Text size={1} muted>
            {'Triggered by'}
          </Text>
          {stage.trigger.avatar ? (
            <Flex align="center" gap={2}>
              <Avatar size={0} initials={stage.trigger.avatar} />
              <Text size={1} weight="medium">
                {stage.trigger.name}
              </Text>
            </Flex>
          ) : (
            <Text size={1} weight="medium">
              {stage.trigger.name}
            </Text>
          )}
        </Flex>

        <Flex align="center" gap={3}>
          <Text size={1} muted>
            {stage.timestamp}
          </Text>
          {stage.duration && (
            <>
              <Text size={1} muted>
                {'•'}
              </Text>
              <Text size={1} muted>
                {`Duration: ${stage.duration}`}
              </Text>
            </>
          )}
        </Flex>

        {stage.details && (
          <Stack space={2}>
            {stage.details.assignee && (
              <Flex align="center" gap={2}>
                <Text size={1} muted>
                  {'Assignee:'}
                </Text>
                <Text size={1}>{stage.details.assignee}</Text>
              </Flex>
            )}

            {stage.details.deadline && (
              <Flex align="center" gap={2}>
                <ClockIcon />
                <Text size={1} muted>
                  {'Deadline:'}
                </Text>
                <Text size={1}>{stage.details.deadline}</Text>
              </Flex>
            )}

            {stage.details.priority && (
              <Flex align="center" gap={2}>
                <WarningOutlineIcon />
                <Text size={1} muted>
                  {'Priority:'}
                </Text>
                <Badge
                  mode="outline"
                  fontSize={1}
                  tone={getPriorityColor(stage.details.priority) as any}
                  style={{textTransform: 'capitalize'}}
                >
                  {stage.details.priority}
                </Badge>
              </Flex>
            )}

            {stage.details.notes && (
              <Card padding={2} radius={3} tone="transparent" border>
                <Text size={1} style={{fontStyle: 'italic'}}>
                  {stage.details.notes}
                </Text>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </StageCard>
  )
}

export function WorkflowsInspector() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  const handleWorkflowSelect = useCallback((workflow: Workflow) => {
    setSelectedWorkflow(workflow)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedWorkflow(null)
  }, [])

  return (
    <Flex direction="column" flex={1} height="fill" overflow="hidden">
      <WorkflowsInspectorHeader
        selectedWorkflow={selectedWorkflow || undefined}
        onBack={selectedWorkflow ? handleBack : undefined}
      />
      <Box padding={3} style={{overflowY: 'auto'}}>
        {selectedWorkflow ? (
          <TimelineContainer space={4}>
            {selectedWorkflow.stages.map((stage) => (
              <WorkflowStageItem key={stage.id} stage={stage} />
            ))}
          </TimelineContainer>
        ) : (
          <Stack space={3}>
            {mockWorkflows.map((workflow) => (
              <WorkflowListItem
                key={workflow.id}
                workflow={workflow}
                onClick={() => handleWorkflowSelect(workflow)}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}
