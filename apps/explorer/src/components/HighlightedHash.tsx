import styled from 'styled-components'

import AddressTag from './AddressTag'
import ClipboardButton from './Buttons/ClipboardButton'
import TextMiddleEllipsis from './TextMiddleEllipsis'

interface HighlightedHashProps {
  text: string
  label?: string
  tag?: string
  textToCopy?: string
  middleEllipsis?: boolean
  fontSize?: number
  maxWidth?: string
  className?: string
}

const HighlightedHash = ({
  text,
  label,
  tag,
  textToCopy,
  middleEllipsis = false,
  fontSize = 15,
  maxWidth = 'auto',
  className
}: HighlightedHashProps) => {
  const [baseHash, group] = text.split(':')

  if (label) {
    return (
      <NamedAddress style={{ fontSize, maxWidth }} className={className} title={text}>
        <WalletIdentity>
          <HighlightedPart>{label}</HighlightedPart>
          {tag && <AddressTag label={tag} />}
        </WalletIdentity>
        <AddressDetails>
          <AddressText>{middleEllipsis ? <TextMiddleEllipsis text={text} /> : text}</AddressText>
          {textToCopy && <ClipboardButton textToCopy={textToCopy} />}
        </AddressDetails>
      </NamedAddress>
    )
  }

  return (
    <div style={{ fontSize, maxWidth, wordBreak: middleEllipsis ? 'initial' : 'break-all' }} className={className}>
      <HighlightedPart>{middleEllipsis ? <TextMiddleEllipsis text={baseHash} /> : baseHash}</HighlightedPart>
      {group && <GroupPart>:{group}</GroupPart>}
      {tag && <AddressTag label={tag} />}

      {textToCopy && (
        <ButtonWrapper>
          <ClipboardButton textToCopy={textToCopy} />
        </ButtonWrapper>
      )}
    </div>
  )
}

export default styled(HighlightedHash)`
  display: flex;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`

const HighlightedPart = styled.span`
  background: ${({ theme }) => theme.global.highlight};
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`

const GroupPart = styled.span`
  color: ${({ theme }) => theme.font.secondary};
`

const ButtonWrapper = styled.div`
  flex-shrink: 0;
`

const NamedAddress = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  min-width: 0;

  ${HighlightedPart} {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
`

const AddressDetails = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  color: ${({ theme }) => theme.font.secondary};
  font-size: inherit;
  font-weight: inherit;

  ${ClipboardButton} {
    flex-shrink: 0;
  }
`

const AddressText = styled(HighlightedPart)`
  min-width: 0;
  overflow-wrap: anywhere;
`

const WalletIdentity = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
`
