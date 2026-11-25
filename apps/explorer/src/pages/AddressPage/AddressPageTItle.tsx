import { useTranslation } from 'react-i18next'
import { RiExternalLinkLine } from 'react-icons/ri'
import styled from 'styled-components'

import { KNOWN_ADDRESSES_LIST_URL, useKnownAddress } from '@/api/addresses/knownAddresses'
import ExternalLink from '@/components/ExternalLink'
import HighlightedHash from '@/components/HighlightedHash'
import SectionTitle from '@/components/SectionTitle'
import useIsContract from '@/pages/AddressPage/useIsContract'

interface AddressPageTitleProps {
  addressStr: string
}

const AddressPageTitle = ({ addressStr }: AddressPageTitleProps) => {
  const { t } = useTranslation()
  const isContract = useIsContract(addressStr)
  const { name: addressName, isUnnamed } = useKnownAddress(addressStr)

  return (
    <SectionTitle
      title={isContract ? t('Contract') : t('Addresses_one')}
      subtitle={
        <AddressIdentity>
          <HighlightedHash text={addressStr} label={addressName} textToCopy={addressStr} />
          {isUnnamed && (
            <ContributionLink href={KNOWN_ADDRESSES_LIST_URL}>
              {t('Add a name')}
              <RiExternalLinkLine aria-hidden />
            </ContributionLink>
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

const ContributionLink = styled(ExternalLink)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
`
