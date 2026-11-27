import {AnimatePresence, motion} from 'motion/react'
import {type CSSProperties} from 'react'
import {Icon} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {RhombusIcon} from '../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../i18n/hooks/useTranslation'

/** Fades the indicator in while the field differs from its base variant, and out again */
export default function FormBaseVariantDiffIndicatorPresence({
  changedFromBaseVariant,
}: {
  changedFromBaseVariant: boolean
}) {
  const {t} = useTranslation()

  return (
    <AnimatePresence>
      {changedFromBaseVariant && (
        <motion.div
          data-testid="base-variant-diff-indicator"
          initial={{opacity: 0}}
          exit={{opacity: 0}}
          animate={{opacity: 1}}
        >
          <Tooltip content={t('changes.from-base-variant.label')} placement="left">
            <Icon
              size={3}
              icon={<RhombusIcon />}
              style={
                {
                  '--icon-color': 'var(--card-badge-suggest-icon-color)',
                } as CSSProperties
              }
            />
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
