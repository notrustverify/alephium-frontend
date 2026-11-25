import { getAddressContributionUrl, validateAddressContribution } from '@/utils/addressContribution'

const contribution = {
  address: '1DxSgjSjsweEoyiykwnWARhws9f26TZLfGXRevLx44NXw',
  name: 'Community pool',
  category: 'Pool',
  source: 'https://example.org/addresses?network=mainnet&group=0'
}

it('prepares a review request with the name field, category and public source without claiming verification', () => {
  const url = new URL(getAddressContributionUrl({ ...contribution, name: ' My pool & friends 🐟 ' }))
  expect(url.origin + url.pathname).toBe('https://github.com/sven-hash/address2name/issues/new')
  expect(url.searchParams.get('title')).toBe('Address name suggestion: My pool & friends 🐟')
  const body = url.searchParams.get('body') || ''
  const suggestedEntry = JSON.parse(body.split('```json\n')[1].split('\n```')[0])
  expect(suggestedEntry).toEqual({ address: contribution.address, name: 'My pool & friends 🐟', type: 'Pool' })
  expect(body).toContain(contribution.source)
  expect(body).toContain('not proof of ownership')
  expect(body).not.toContain('exchangename')
  expect(body).not.toContain('"state"')
})

it('accepts valid trimmed contributions with an optional category', () => {
  expect(
    validateAddressContribution({ ...contribution, address: ` ${contribution.address} `, category: '' })
  ).toBeUndefined()
})

it.each([
  [{ address: 'invalid' }, 'Enter a valid Alephium address.'],
  [{ address: `${contribution.address.slice(0, -1)}0` }, 'Enter a valid Alephium address.'],
  [{ name: '   ' }, 'Enter a name for this address.'],
  [{ name: 'a'.repeat(61) }, 'Keep the name to 60 characters or fewer.'],
  [{ category: 'a'.repeat(41) }, 'Keep the category to 40 characters or fewer.'],
  [{ source: '' }, 'Add a public http or https URL that supports this name.'],
  [{ source: 'javascript:alert(1)' }, 'Add a public http or https URL that supports this name.'],
  [{ source: 'https://user:password@example.org' }, 'Add a public http or https URL that supports this name.'],
  [{ source: `https://example.org/${'a'.repeat(500)}` }, 'Keep the source URL to 500 characters or fewer.']
])('rejects invalid contribution data %j', (changes, error) => {
  expect(validateAddressContribution({ ...contribution, ...changes })).toBe(error)
})
