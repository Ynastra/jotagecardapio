import type { Store } from './types'

type StoreAddressFields = Pick<Store, 'address' | 'city' | 'state' | 'addressDisplay'>

function joinCityAndState(city: string | null, state: string | null): string | null {
    const cityName = city?.trim() ?? ''
    const stateCode = state?.trim() ?? ''

    if (cityName && stateCode) {
        return `${cityName}/${stateCode}`
    }

    const single = cityName || stateCode
    const result = single || null
    return result
}

export function describeStoreAddress(store: StoreAddressFields): string | null {
    if (store.addressDisplay === 'hidden') {
        return null
    }

    const cityLine = joinCityAndState(store.city, store.state)

    if (store.addressDisplay === 'city') {
        return cityLine
    }

    const street = store.address?.trim() ?? ''
    const parts = [street, cityLine].filter((part): part is string => Boolean(part))
    const result = parts.length > 0 ? parts.join(', ') : null
    return result
}
