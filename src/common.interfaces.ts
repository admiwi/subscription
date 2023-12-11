export class SubscriptionDTO {
    id?: string
    userEmail: string
    product: string
    shipToAddress?: AddressDTO
    terms: "MONTHLY" | "YEARLY"
}

export class AddressDTO {
    addr1: string
    addr2?: string
    addr3?: string
    state: string
    city: string
    country: string
    postalCode: string
}

export class SubscriptionIdDTO {
    userEmail: string
    product: string
}