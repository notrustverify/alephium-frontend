import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'

import { knownAddressesQuery } from '@/api/addresses/knownAddresses'
import AddressContributionModal from '@/pages/AddressPage/AddressContributionModal'
import { lightTheme } from '@/styles/themes'

vi.mock('@/api/client', () => ({ default: { networkType: 'mainnet' } }))

const address = '1DxSgjSjsweEoyiykwnWARhws9f26TZLfGXRevLx44NXw'
let container: HTMLDivElement
let root: Root
let queryClient: QueryClient

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  queryClient.setQueryData(knownAddressesQuery.queryKey, {})
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  queryClient.clear()
  vi.unstubAllGlobals()
})

const renderForm = async (initialAddress = address) => {
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={lightTheme}>
          <MemoryRouter>
            <AddressContributionModal initialAddress={initialAddress} initialCategory="Exchange" onClose={vi.fn()} />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    )
  )
}

const fill = async (label: string, value: string) => {
  const field = [...container.querySelectorAll('label')].find((element) => element.textContent?.startsWith(label))
  const input = document.getElementById(field!.htmlFor) as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

it('prefills the address and category and focuses the name', async () => {
  await renderForm()
  expect(container.querySelector('dialog')?.open).toBe(true)
  expect(container.querySelector('input')?.value).toContain('Address name suggestion')
  expect(container.querySelector('input[maxlength="100"]')?.getAttribute('value')).toBe(address)
  expect((document.activeElement as HTMLInputElement)?.maxLength).toBe(60)
  expect(container.querySelector('input[maxlength="40"]')?.getAttribute('value')).toBe('Exchange')
})

it('prevents invalid submissions and prepares the GitHub draft after valid input', async () => {
  await renderForm()
  const form = container.querySelector('form')!
  let event = new Event('submit', { bubbles: true, cancelable: true })
  await act(async () => {
    form.dispatchEvent(event)
  })
  expect(event.defaultPrevented).toBe(true)
  expect(container.querySelector('[role="alert"]')?.textContent).toBe('Enter a name for this address.')

  await fill('Name', 'Community pool')
  await fill('Supporting source', 'https://example.org/proof')
  event = new Event('submit', { bubbles: true, cancelable: true })
  await act(async () => {
    form.dispatchEvent(event)
  })
  expect(event.defaultPrevented).toBe(false)
  expect(form.action).toBe('https://github.com/sven-hash/address2name/issues/new')
  expect(form.target).toBe('_blank')
  expect(form.getAttribute('rel')).toContain('noopener')
  expect((form.elements.namedItem('body') as HTMLInputElement).value).toContain('Community pool')
  expect((form.elements.namedItem('body') as HTMLInputElement).value).toContain('https://example.org/proof')
})

it('blocks duplicate suggestions for an address that already has a name', async () => {
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [address]: { name: 'Existing name' } })
  await renderForm()
  await fill('Name', 'Different name')
  await fill('Supporting source', 'https://example.org/proof')
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Existing name')
  expect(container.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true)
  const event = new Event('submit', { bubbles: true, cancelable: true })
  await act(async () => {
    container.querySelector('form')!.dispatchEvent(event)
  })
  expect(event.defaultPrevented).toBe(true)
})

it('prefills a groupless address without the group and allows submitting without a source', async () => {
  const baseAddress = '3cUrwi3GByza3HdjLDH7EeLWmSuLDXBpUbBiqdBYyNo4qLWfcHzwC'
  await renderForm(`${baseAddress}:2`)
  expect(container.querySelector('input[maxlength="100"]')?.getAttribute('value')).toBe(baseAddress)
  expect(container.querySelector('input[type="url"]')?.hasAttribute('required')).toBe(false)
  await fill('Name', 'Community wallet')

  const event = new Event('submit', { bubbles: true, cancelable: true })
  await act(async () => {
    container.querySelector('form')!.dispatchEvent(event)
  })
  expect(event.defaultPrevented).toBe(false)
  const body = (container.querySelector('input[name="body"]') as HTMLInputElement).value
  expect(body).not.toContain('## Supporting source')
  expect(body).toContain(baseAddress)
  expect(body).not.toContain(`${baseAddress}:2`)
})

it('finds an existing name for a groupless address when a group is pasted', async () => {
  const baseAddress = '3cUrwi3GByza3HdjLDH7EeLWmSuLDXBpUbBiqdBYyNo4qLWfcHzwC'
  queryClient.setQueryData(knownAddressesQuery.queryKey, { [baseAddress]: { name: 'Known groupless wallet' } })
  await renderForm()
  await fill('Address', `${baseAddress}:1`)
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Known groupless wallet')
  expect(container.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true)
})
