import { colord } from 'colord'
import { Tag, X } from 'lucide-react'
import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiExternalLinkLine, RiGithubFill } from 'react-icons/ri'
import styled from 'styled-components'

import { useKnownAddress } from '@/api/addresses/knownAddresses'
import AddressTag from '@/components/AddressTag'
import Button from '@/components/Buttons/Button'
import ExternalLink from '@/components/ExternalLink'
import { AddressLink } from '@/components/Links'
import { deviceBreakPoints } from '@/styles/globalStyles'
import { contributionLimits, getAddressContributionUrl, validateAddressContribution } from '@/utils/addressContribution'

interface AddressContributionModalProps {
  initialAddress: string
  initialCategory?: string
  onClose: () => void
}

const AddressContributionModal = ({ initialAddress, initialCategory = '', onClose }: AddressContributionModalProps) => {
  const { t } = useTranslation()
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [address, setAddress] = useState(initialAddress)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [source, setSource] = useState('')
  const [error, setError] = useState<ReturnType<typeof validateAddressContribution>>()
  const { name: existingName } = useKnownAddress(address.trim())
  const contribution = { address, name, category, source }
  const submissionUrl = new URL(getAddressContributionUrl(contribution))

  useEffect(() => {
    const trigger = document.activeElement
    const dialog = dialogRef.current
    dialog?.showModal()
    nameRef.current?.focus()

    return () => {
      dialog?.close()
      if (trigger instanceof HTMLElement) trigger.focus()
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const validationError = validateAddressContribution(contribution)
    if (validationError || existingName) {
      event.preventDefault()
      setError(validationError)
    }
  }

  return (
    <Dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose()
      }}
    >
      <Header>
        <HeaderIcon>
          <Tag size={20} aria-hidden />
        </HeaderIcon>
        <CloseButton type="button" onClick={onClose} aria-label={t('Close')}>
          <X size={20} aria-hidden />
        </CloseButton>
        <h2 id={`${id}-title`}>{t('Help identify an address')}</h2>
        <p id={`${id}-description`}>{t('Share a name and a public source to help others recognize this address.')}</p>
      </Header>
      <Form
        action={submissionUrl.origin + submissionUrl.pathname}
        method="get"
        target="_blank"
        rel="noopener noreferrer"
        onSubmit={handleSubmit}
        onChange={() => setError(undefined)}
        noValidate
      >
        <input type="hidden" name="title" value={submissionUrl.searchParams.get('title') || ''} />
        <input type="hidden" name="body" value={submissionUrl.searchParams.get('body') || ''} />
        <Field>
          <label htmlFor={`${id}-address`}>{t('Address')}</label>
          <Input
            id={`${id}-address`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={contributionLimits.address}
            required
            spellCheck={false}
            autoCapitalize="none"
            $monospace
          />
          <Hint>{t('Mainnet addresses only')}</Hint>
        </Field>
        {existingName && (
          <Notice role="alert">
            {t('This address already has a name:')} <AddressLink address={address.trim()} />
          </Notice>
        )}
        <Field>
          <label htmlFor={`${id}-name`}>{t('Name')}</label>
          <Input
            ref={nameRef}
            id={`${id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('e.g. an exchange, project, or mining pool')}
            maxLength={contributionLimits.name}
            required
          />
        </Field>
        <Field>
          <label htmlFor={`${id}-category`}>
            {t('Category')} <Optional>{t('(optional)')}</Optional>
          </label>
          <Input
            id={`${id}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t('e.g. Exchange')}
            list={`${id}-categories`}
            maxLength={contributionLimits.category}
          />
          <datalist id={`${id}-categories`}>
            {['Exchange', 'Pool', 'Miner', 'Bridge', 'Uniswap', 'Alephium'].map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </Field>
        <Field>
          <label htmlFor={`${id}-source`}>{t('Supporting source')}</label>
          <Input
            id={`${id}-source`}
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="https://"
            maxLength={contributionLimits.source}
            required
            spellCheck={false}
            autoCapitalize="none"
          />
          <Hint>
            {t(
              'Link to an official website, announcement, or other public evidence connecting the name to this address.'
            )}
          </Hint>
        </Field>
        {name.trim() && (
          <Preview aria-label={t('Name preview')}>
            <Hint>{t('Name preview')}</Hint>
            <PreviewIdentity>
              <strong>{name.trim()}</strong>
              {category.trim() && <AddressTag label={category.trim()} />}
            </PreviewIdentity>
          </Preview>
        )}
        {error && <Notice role="alert">{t(error)}</Notice>}
        <Footer>
          <Hint>{t('You will review and submit a public issue on GitHub. A GitHub account is required.')}</Hint>
          <SubmitButton type="submit" accent disabled={!!existingName}>
            <RiGithubFill size={18} aria-hidden />
            {t('Continue on GitHub')}
            <RiExternalLinkLine size={15} aria-hidden />
          </SubmitButton>
          <Hint>{t('A maintainer reviews suggestions before names appear in the explorer.')}</Hint>
          <Guidelines href="https://github.com/sven-hash/address2name#how-to-claim">
            {t('Claiming your own address? Read the ownership verification guide.')}
            <RiExternalLinkLine aria-hidden />
          </Guidelines>
        </Footer>
      </Form>
    </Dialog>
  )
}

export default AddressContributionModal

const Dialog = styled.dialog`
  position: fixed;
  inset: 25px 25px 25px auto;
  width: 540px;
  max-width: calc(100vw - 50px);
  max-height: calc(100dvh - 50px);
  margin: 0;
  padding: 28px;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 12px;
  color: ${({ theme }) => theme.font.primary};
  background: ${({ theme }) => theme.bg.secondary};
  box-shadow: ${({ theme }) => theme.shadow.tertiary};
  overflow-y: auto;
  font-size: 13px;

  &::backdrop {
    background: ${({ theme }) => colord(theme.bg.tertiary).alpha(0.6).toRgbString()};
    backdrop-filter: blur(3px);
  }

  @media ${deviceBreakPoints.mobile} {
    inset: 12px 12px 12px auto;
    max-width: calc(100vw - 24px);
    max-height: calc(100dvh - 24px);
    padding: 24px 20px;
  }
`

const Header = styled.div`
  position: relative;
  margin-bottom: 24px;

  h2 {
    margin: 16px 0 10px;
    padding-right: 20px;
    font-size: 22px;
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.font.secondary};
    line-height: 1.6;
  }
`

const HeaderIcon = styled.div`
  display: inline-flex;
  padding: 10px;
  border-radius: 10px;
  color: ${({ theme }) => theme.global.accent};
  background: ${({ theme }) => theme.bg.accent};
`

const CloseButton = styled.button`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  padding: 8px;
  border-radius: 50%;
  color: ${({ theme }) => theme.font.secondary};
  background: ${({ theme }) => theme.bg.primary};
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.global.accent};
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-weight: 600;
  }
`

const Input = styled.input<{ $monospace?: boolean }>`
  width: 100%;
  min-width: 0;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 8px;
  background: ${({ theme }) => theme.bg.primary};
  color: ${({ theme }) => theme.font.primary};
  font-size: ${({ $monospace }) => ($monospace ? '12px' : '14px')};
  font-family: ${({ $monospace }) => ($monospace ? 'monospace' : 'inherit')};
  line-height: 1.4;
  &::placeholder {
    color: ${({ theme }) => theme.font.secondary};
    opacity: 0.8;
  }
  &:focus {
    border-color: ${({ theme }) => theme.global.accent};
    outline: 1px solid ${({ theme }) => theme.global.accent};
  }
  @media ${deviceBreakPoints.mobile} {
    font-size: 16px;
  }
`

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.font.secondary};
  font-size: 12px;
  line-height: 1.6;
`

const Optional = styled.span`
  color: ${({ theme }) => theme.font.secondary};
  font-weight: 400;
`

const Notice = styled.div`
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.global.alert};
  overflow-wrap: anywhere;
`

const Preview = styled.div`
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.border.primary};
  border-radius: 8px;
  background: ${({ theme }) => theme.bg.primary};
`

const PreviewIdentity = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  overflow-wrap: anywhere;
  strong {
    min-width: 0;
    max-width: 100%;
    font-size: 14px;
  }
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.border.primary};
`

const SubmitButton = styled(Button)`
  min-height: 44px;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.global.accent};
    outline-offset: 3px;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`

const Guidelines = styled(ExternalLink)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 1.6;
`
