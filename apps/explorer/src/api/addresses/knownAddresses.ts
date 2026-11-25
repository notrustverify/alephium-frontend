import { ONE_DAY_MS, ONE_HOUR_MS } from '@alephium/shared'
import { queryOptions, useQuery } from '@tanstack/react-query'

import client from '@/api/client'

const KNOWN_ADDRESSES_URL =
  'https://raw.githubusercontent.com/sven-hash/address2name/refs/heads/main/know-walletsv2.json'

export const knownAddressesQuery = queryOptions({
  queryKey: ['knownAddresses', KNOWN_ADDRESSES_URL],
  queryFn: async ({ signal }): Promise<Record<string, string>> => {
    const response = await fetch(KNOWN_ADDRESSES_URL, { signal })

    if (!response.ok) throw new Error('Failed to fetch known addresses')

    const data: unknown = await response.json()

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid known addresses response')
    }

    return Object.fromEntries(
      Object.entries(data).flatMap(([address, entry]) =>
        entry && typeof entry === 'object' && 'name' in entry && typeof entry.name === 'string' && entry.name.trim()
          ? [[address, entry.name.trim()]]
          : []
      )
    )
  },
  staleTime: ONE_HOUR_MS,
  gcTime: ONE_DAY_MS,
  retry: 1
})

export const useAddressName = (address: string) => {
  const { data } = useQuery({
    ...knownAddressesQuery,
    enabled: client.networkType === 'mainnet'
  })

  return client.networkType === 'mainnet' ? data?.[address] : undefined
}
