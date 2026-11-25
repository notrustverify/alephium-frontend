import { QueryClient } from '@tanstack/react-query'

import { knownAddressesQuery } from '@/api/addresses/knownAddresses'

vi.mock('@/api/client', () => ({ default: { networkType: 'mainnet' } }))

let queryClient: QueryClient
const fetchMock = vi.fn()

beforeEach(() => {
  queryClient = new QueryClient()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  queryClient.clear()
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

it('reads names from the address-keyed registry and reuses a single cached request', async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ address1: { name: ' cgs ', state: 'verified' }, address2: { name: 'Sesame wallet' } })
    )
  )

  const names = await queryClient.fetchQuery(knownAddressesQuery)
  await queryClient.fetchQuery(knownAddressesQuery)

  expect(names.address1?.name).toBe('cgs')
  expect(names.address2?.name).toBe('Sesame wallet')
  expect(names.unknownAddress).toBeUndefined()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock.mock.calls[0][0]).toBe(
    'https://raw.githubusercontent.com/sven-hash/address2name/refs/heads/main/know-walletsv2.json'
  )
})

it('ignores empty or malformed entries without losing valid names', async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        valid: { name: 'Pool' },
        blank: { name: ' ' },
        number: { name: 42 },
        missing: {},
        invalid: null
      })
    )
  )

  expect(await queryClient.fetchQuery(knownAddressesQuery)).toEqual({ valid: { name: 'Pool' } })
})

it('reads only name and type, ignoring exchange identifiers when the name field is empty', async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        exchange: { name: '', exchangename: ' gateio ', type: '' },
        namedExchange: { name: ' Gate.io ', exchangename: 'gateio', type: ' Exchange ' },
        pool: { name: 'Metapool.tech', type: 'Pool' },
        categoryOnly: { type: 'Miner' }
      })
    )
  )

  expect(await queryClient.fetchQuery(knownAddressesQuery)).toEqual({
    namedExchange: { name: 'Gate.io', tag: 'Exchange' },
    pool: { name: 'Metapool.tech', tag: 'Pool' },
    categoryOnly: { tag: 'Miner' }
  })
})

it.each([null, [], 'invalid'])('rejects an invalid registry: %j', async (data) => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(data)))

  await expect(queryClient.fetchQuery({ ...knownAddressesQuery, retry: false })).rejects.toThrow(
    'Invalid known addresses response'
  )
})

it('rejects an unsuccessful HTTP response', async () => {
  fetchMock.mockResolvedValue(new Response('Unavailable', { status: 503 }))

  await expect(queryClient.fetchQuery({ ...knownAddressesQuery, retry: false })).rejects.toThrow(
    'Failed to fetch known addresses'
  )
})
