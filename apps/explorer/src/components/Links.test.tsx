import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { KNOWN_ADDRESSES_LIST_URL, knownAddressesQuery } from '@/api/addresses/knownAddresses'
import client from '@/api/client'
import { AddressLink } from '@/components/Links'
import AddressPageTitle from '@/pages/AddressPage/AddressPageTItle'
import { lightTheme } from '@/styles/themes'

vi.mock('@/api/client', () => ({ default: { networkType: 'mainnet' } }))
vi.mock('@/api/assets/assetsHooks', () => ({ useAssetsMetadata: () => ({ fungibleTokens: [] }) }))

const address = '1DxSgjSjsweEoyiykwnWARhws9f26TZLfGXRevLx44NXw'
const name = 'Known wallet: mining'
let container: HTMLDivElement
let root: Root
let queryClient: QueryClient
const writeText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText)
  client.networkType = 'mainnet'
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  queryClient.clear()
  writeText.mockClear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const renderAddress = async () => {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <MemoryRouter>
            <AddressLink address={address} />
            <AddressPageTitle addressStr={address} />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    )
  })
}

it('shows the wallet name in links and the heading while linking and copying the address', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: name })
  await renderAddress()

  const link = container.querySelector('a')
  expect(link?.textContent).toContain(name)
  expect(link?.getAttribute('href')).toBe(`/addresses/${address}`)
  expect(container.querySelector('h2')?.textContent).toContain(name)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(link?.textContent).toContain(`${address.slice(0, 6)}…${address.slice(-6)}`)
  expect(container.querySelector(`[title="${address}"]`)).not.toBeNull()
  expect(container.querySelector(`a[href="${KNOWN_ADDRESSES_LIST_URL}"]`)).toBeNull()

  for (const icon of container.querySelectorAll('svg')) {
    await act(async () => icon.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
  }

  expect(writeText).toHaveBeenCalledTimes(2)
  expect(writeText).toHaveBeenNthCalledWith(1, address)
  expect(writeText).toHaveBeenNthCalledWith(2, address)
})

it('shows the original address and a contribution link when it is not in the registry', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, {})
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  const contributionLink = container.querySelector(`a[href="${KNOWN_ADDRESSES_LIST_URL}"]`)
  expect(contributionLink?.textContent).toBe('Add a name')
  expect(contributionLink?.getAttribute('target')).toBe('_blank')
  expect(contributionLink?.getAttribute('rel')).toContain('noopener')
})

it('replaces the displayed address after the shared registry request completes', async () => {
  let resolveResponse!: (response: Response) => void
  const fetchMock = vi.fn().mockReturnValue(
    new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
  )
  vi.stubGlobal('fetch', fetchMock)
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)

  expect(container.querySelector(`a[href="${KNOWN_ADDRESSES_LIST_URL}"]`)).toBeNull()

  await act(async () => {
    resolveResponse(new Response(JSON.stringify({ [address]: { name } })))
    await queryClient.fetchQuery(knownAddressesQuery)
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  expect(container.querySelector('a')?.textContent).toContain(name)
  expect(container.querySelector('h2')?.textContent).toContain(name)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('keeps addresses visible when the registry request fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')))
  await queryClient.fetchQuery({ ...knownAddressesQuery, retry: false }).catch(() => undefined)
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(container.querySelector(`a[href="${KNOWN_ADDRESSES_LIST_URL}"]`)).toBeNull()
})

it('does not apply cached mainnet names on testnet', async () => {
  client.networkType = 'testnet'
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: name })
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(container.textContent).not.toContain(name)
  expect(container.querySelector(`a[href="${KNOWN_ADDRESSES_LIST_URL}"]`)).toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
})
