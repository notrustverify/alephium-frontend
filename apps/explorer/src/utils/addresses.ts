import { getBaseAddressStr } from '@alephium/shared/transactions'
import { isGrouplessAddressWithGroupIndex, isValidAddress } from '@alephium/web3'

export const getAddressWithoutGroup = (address: string) =>
  address.includes(':') && isValidAddress(address) && isGrouplessAddressWithGroupIndex(address)
    ? getBaseAddressStr(address)
    : address
