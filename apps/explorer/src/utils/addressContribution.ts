import { isValidAddress } from '@alephium/web3'

export interface AddressContribution {
  address: string
  name: string
  category: string
  source: string
}

export const contributionLimits = { address: 100, name: 60, category: 40, source: 500 }

export const validateAddressContribution = (contribution: AddressContribution) => {
  const { address, name, category, source } = contribution

  if (!isValidAddress(address.trim())) return 'Enter a valid Alephium address.'
  if (!name.trim()) return 'Enter a name for this address.'
  if (name.trim().length > contributionLimits.name) return 'Keep the name to 60 characters or fewer.'
  if (category.trim().length > contributionLimits.category) return 'Keep the category to 40 characters or fewer.'
  if (source.trim().length > contributionLimits.source) return 'Keep the source URL to 500 characters or fewer.'

  try {
    const url = new URL(source.trim())
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid source')
  } catch {
    return 'Add a public http or https URL that supports this name.'
  }
}

export const getAddressContributionUrl = ({ address, name, category, source }: AddressContribution) => {
  const url = new URL('https://github.com/sven-hash/address2name/issues/new')
  const body = [
    '## Address name suggestion',
    '',
    'Please review this suggestion for know-walletsv2.json.',
    '',
    '```json',
    JSON.stringify({ address: address.trim(), name: name.trim(), type: category.trim() }, null, 2),
    '```',
    '',
    '## Supporting source',
    source.trim(),
    '',
    'Submitted through the Alephium explorer contribution form. This is a suggestion, not proof of ownership.'
  ].join('\n')

  url.searchParams.set('title', `Address name suggestion: ${name.trim()}`)
  url.searchParams.set('body', body)

  return url.toString()
}
