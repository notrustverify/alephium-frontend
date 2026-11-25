import { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Ellipsed from '@/components/Ellipsed'

import AddressTag from './AddressTag'
import ClipboardButton from './Buttons/ClipboardButton'

interface HashEllipsedProps extends HTMLAttributes<HTMLDivElement> {
  hash: string
  label?: string
  tag?: string
  copyTooltipText?: string
  disableCopy?: boolean
  className?: string
}

const HashEllipsed = ({
  hash,
  label,
  tag,
  copyTooltipText,
  disableCopy = false,
  className,
  ...props
}: HashEllipsedProps) => {
  const { t } = useTranslation()

  return (
    <Container className={className} title={label ? hash : undefined} $hasLabel={!!label}>
      <HashContainer>
        {label || tag ? (
          <NamedHash data-tooltip-id="default" data-tooltip-content={`${label || tag} · ${hash}`} {...props}>
            <WalletIdentity>
              <WalletName>{label || hash}</WalletName>
              {tag && <AddressTag label={tag} compact />}
            </WalletIdentity>
            {label && (
              <SecondaryHash>
                {hash.slice(0, 6)}…{hash.slice(-6)}
              </SecondaryHash>
            )}
          </NamedHash>
        ) : (
          <Ellipsed text={hash} {...props} />
        )}
      </HashContainer>
      {!disableCopy && (
        <CopyButton textToCopy={hash} tooltip={copyTooltipText || t('Copy hash')} className={className} hasBackground />
      )}
    </Container>
  )
}

export default HashEllipsed

const CopyButton = styled(ClipboardButton)`
  position: absolute;
  right: 0;
  display: none;
`

const HashContainer = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`

// If the address does not fit beside the name, it wraps out of this single-line viewport.
// The full address remains available in the tooltip and the copy action.
const NamedHash = styled.div`
  display: flex;
  flex-wrap: wrap;
  column-gap: 8px;
  line-height: 1.5;
  max-height: 1.5em;
  overflow: hidden;
  align-items: center;
`

const WalletName = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
`

const WalletIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  max-width: 100%;
  min-width: 0;
`

const SecondaryHash = styled.span`
  flex-shrink: 0;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.85em;
  color: ${({ theme }) => theme.font.secondary};
`

const Container = styled.div<{ $hasLabel: boolean }>`
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  overflow: hidden;
  font-family: ${({ $hasLabel }) => ($hasLabel ? 'inherit' : "'Roboto Mono'")};
  letter-spacing: ${({ $hasLabel }) => ($hasLabel ? 'normal' : 'inherit')};
  line-height: normal;

  &:hover {
    ${CopyButton} {
      display: inline-flex;
    }

    ${HashContainer} {
      -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 10%);
      mask-image: linear-gradient(to left, rgba(0, 0, 0, 0) 20px, rgba(0, 0, 0, 1) 60px);
    }
  }
`
