import { colord } from 'colord'
import { ArrowLeftRight, Hammer, Link2, LucideIcon, Tag, Waves } from 'lucide-react'
import styled from 'styled-components'

interface AddressTagProps {
  label: string
  compact?: boolean
  className?: string
}

const categoryIcons: Record<string, LucideIcon> = {
  exchange: ArrowLeftRight,
  miner: Hammer,
  pool: Waves,
  bridge: Link2,
  uniswap: ArrowLeftRight
}

const AddressTag = ({ label, compact = false, className }: AddressTagProps) => {
  const Icon = categoryIcons[label.toLowerCase()] || Tag

  return (
    <Container $compact={compact} className={className}>
      <Icon aria-hidden focusable={false} strokeWidth={1.75} />
      <span>{label}</span>
    </Container>
  )
}

export default AddressTag

const Container = styled.span<{ $compact: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  align-self: center;
  gap: 4px;
  min-height: ${({ $compact }) => ($compact ? '18px' : '24px')};
  padding: ${({ $compact }) => ($compact ? '2px 6px' : '4px 8px')};
  border-radius: ${({ $compact }) => ($compact ? '4px' : '6px')};
  border: 1px solid
    ${({ theme }) =>
      colord(theme.global.highlight)
        .alpha(theme.name === 'dark' ? 0.3 : 0.18)
        .toRgbString()};
  background: ${({ theme }) =>
    colord(theme.global.highlight)
      .alpha(theme.name === 'dark' ? 0.14 : 0.07)
      .toRgbString()};
  color: ${({ theme }) =>
    theme.name === 'dark' ? colord(theme.global.highlight).lighten(0.14).toHex() : theme.global.highlight};
  font-family: 'Geist', sans-serif;
  font-size: ${({ $compact }) => ($compact ? '10px' : '11px')};
  font-weight: 500;
  line-height: 1;
  letter-spacing: normal;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
    width: ${({ $compact }) => ($compact ? '11px' : '12px')};
    height: ${({ $compact }) => ($compact ? '11px' : '12px')};
  }
`
