import { Tag } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { useKnownAddress } from '@/api/addresses/knownAddresses'
import HighlightedHash from '@/components/HighlightedHash'
import SectionTitle from '@/components/SectionTitle'
import ModalPortal from '@/modals/ModalPortal'
import AddressContributionModal from '@/pages/AddressPage/AddressContributionModal'
import useIsContract from '@/pages/AddressPage/useIsContract'

interface AddressPageTitleProps {
  addressStr: string
}

const AddressPageTitle = ({ addressStr }: AddressPageTitleProps) => {
  const { t } = useTranslation()
  const isContract = useIsContract(addressStr)
  const { name: addressName, tag, isUnnamed } = useKnownAddress(addressStr)
  const [isContributing, setIsContributing] = useState(false)

  return (
    <SectionTitle
      title={isContract ? t('Contract') : t('Addresses_one')}
      subtitle={
        <AddressIdentity>
          <HighlightedHash text={addressStr} label={addressName} tag={tag} textToCopy={addressStr} />
          {isUnnamed && (
            <ContributionButton
              type="button"
              onClick={() => setIsContributing(true)}
              aria-haspopup="dialog"
              data-tooltip-id="default"
              data-tooltip-content={t('Help others identify it by contributing a name on GitHub.')}
            >
              {t('Recognize this address?')}
              <Tag size={14} aria-hidden />
            </ContributionButton>
          )}
          {isContributing && (
            <ModalPortal>
              <AddressContributionModal
                key={addressStr}
                initialAddress={addressStr}
                initialCategory={tag}
                onClose={() => setIsContributing(false)}
              />
            </ModalPortal>
          )}
        </AddressIdentity>
      }
    />
  )
}

export default AddressPageTitle

const AddressIdentity = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  min-width: 0;
`

const ContributionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  padding: 6px 0;
  background: transparent;
  color: ${({ theme }) => theme.global.accent};
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.global.accent};
    outline-offset: 4px;
  }
`
