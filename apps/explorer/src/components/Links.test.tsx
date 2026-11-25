import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { knownAddressesQuery } from '@/api/addresses/knownAddresses'
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

const renderAddress = async (addressStr = address) => {
  await act(async () => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <MemoryRouter>
            <AddressLink address={addressStr} />
            <AddressPageTitle addressStr={addressStr} />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    )
  })
}

it('shows the wallet name in links and the heading while linking and copying the address', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: { name } })
  await renderAddress()

  const link = container.querySelector('a')
  expect(link?.textContent).toContain(name)
  expect(link?.getAttribute('href')).toBe(`/addresses/${address}`)
  expect(container.querySelector('h2')?.textContent).toContain(name)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(link?.textContent).toContain(`${address.slice(0, 6)}…${address.slice(-6)}`)
  expect(container.querySelector(`[title="${address}"]`)).not.toBeNull()
  expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()

  for (const icon of container.querySelectorAll('svg')) {
    await act(async () => icon.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
  }

  expect(writeText).toHaveBeenCalledTimes(2)
  expect(writeText).toHaveBeenNthCalledWith(1, address)
  expect(writeText).toHaveBeenNthCalledWith(2, address)
})

const grouplessAddress = '3cUrwi3GByza3HdjLDH7EeLWmSuLDXBpUbBiqdBYyNo4qLWfcHzwC'

it.each([0, 1, 2, 3])(
  'uses the base groupless address for group %i names, labels, links and copying',
  async (group) => {
    queryClient.setQueryData(knownAddressesQuery.queryKey, { [grouplessAddress]: { name: 'Groupless wallet' } })
    await renderAddress(`${grouplessAddress}:${group}`)

    expect(container.querySelector('a')?.textContent).toContain('Groupless wallet')
    expect(container.querySelector('a')?.getAttribute('href')).toBe(`/addresses/${grouplessAddress}`)
    expect(container.querySelector('h2')?.textContent).toContain(`Groupless wallet${grouplessAddress}`)
    expect(container.querySelector('h2')?.textContent).not.toContain(`${grouplessAddress}:`)
    expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()
    expect(container.querySelector('a [title]')?.getAttribute('title')).toBe(grouplessAddress)

    for (const icon of container.querySelectorAll('svg')) {
      await act(async () => icon.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
    }
    expect(writeText).toHaveBeenCalledTimes(2)
    expect(writeText).toHaveBeenNthCalledWith(1, grouplessAddress)
    expect(writeText).toHaveBeenNthCalledWith(2, grouplessAddress)
  }
)

it('omits the group suffix for unnamed groupless addresses', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, {})
  await renderAddress(`${grouplessAddress}:0`)

  expect(container.querySelector('h2')?.textContent).toContain(grouplessAddress)
  expect(container.querySelector('h2')?.textContent).not.toContain(':0')
  expect(container.querySelector('a')?.textContent).not.toContain(':0')
  expect(container.querySelector('a')?.getAttribute('href')).toBe(`/addresses/${grouplessAddress}`)
})

it('shows the original address and a contribution link when it is not in the registry', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, {})
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  const contributionLink = container.querySelector('button[aria-haspopup="dialog"]')
  expect(contributionLink?.textContent).toBe('Recognize this address?')
  expect(contributionLink?.getAttribute('data-tooltip-content')).toBe(
    'Help others identify it by contributing a name on GitHub.'
  )
})

it('shows exchange category tags alongside the label in links and the heading', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: { name: 'Gate.io', tag: 'Exchange' } })
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain('Gate.ioExchange')
  expect(container.querySelector('h2')?.textContent).toContain('Gate.ioExchange')
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()
})

it('keeps the address and contribution link visible when only a category is known', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: { tag: 'Exchange' } })
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)
  expect(container.querySelector('a')?.textContent).toContain('Exchange')
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(container.querySelector('button[aria-haspopup="dialog"]')).not.toBeNull()
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

  expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()

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
  expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()
})

it('does not apply cached mainnet names on testnet', async () => {
  client.networkType = 'testnet'
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: { name, tag: 'Exchange' } })
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  await renderAddress()

  expect(container.querySelector('a')?.textContent).toContain(address)
  expect(container.querySelector('h2')?.textContent).toContain(address)
  expect(container.textContent).not.toContain(name)
  expect(container.textContent).not.toContain('Exchange')
  expect(container.querySelector('button[aria-haspopup="dialog"]')).toBeNull()
  expect(fetchMock).not.toHaveBeenCalled()
})
