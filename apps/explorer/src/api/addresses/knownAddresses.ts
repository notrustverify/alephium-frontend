import { ONE_DAY_MS, ONE_HOUR_MS } from '@alephium/shared'
import { queryOptions, useQuery } from '@tanstack/react-query'

import client from '@/api/client'
import { getAddressWithoutGroup } from '@/utils/addresses'

const KNOWN_ADDRESSES_URL =
  'https://raw.githubusercontent.com/sven-hash/address2name/refs/heads/main/know-walletsv2.json'

export const KNOWN_ADDRESSES_LIST_URL = 'https://github.com/sven-hash/address2name/blob/main/know-walletsv2.json'

interface KnownAddress {
  name?: string
  tag?: string
}

const readText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const knownAddressesQuery = queryOptions({
  queryKey: ['knownAddresses', KNOWN_ADDRESSES_URL, 3],
  queryFn: async ({ signal }): Promise<Record<string, KnownAddress>> => {
    const response = await fetch(KNOWN_ADDRESSES_URL, { signal })

    if (!response.ok) throw new Error('Failed to fetch known addresses')

    const data: unknown = await response.json()

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid known addresses response')
    }

    return Object.fromEntries(
      Object.entries(data).flatMap(([address, entry]) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []

        const name = 'name' in entry ? readText(entry.name) : ''
        const tag = 'type' in entry ? readText(entry.type) : ''

        return name || tag ? [[address, { name: name || undefined, tag: tag || undefined }]] : []
      })
    )
  },
  staleTime: ONE_HOUR_MS,
  gcTime: ONE_DAY_MS,
  retry: 1
})

export const useKnownAddress = (address: string) => {
  const { data, isSuccess } = useQuery({
    ...knownAddressesQuery,
    enabled: client.networkType === 'mainnet'
  })

  const knownAddress = client.networkType === 'mainnet' ? data?.[getAddressWithoutGroup(address)] : undefined

  return {
    ...knownAddress,
    isUnnamed: client.networkType === 'mainnet' && isSuccess && !knownAddress?.name
  }
}
