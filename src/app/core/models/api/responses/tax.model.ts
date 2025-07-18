import { TaxHistory } from "./tax-history.model";

export interface Tax {
    id: number,
    name: string,
    percentage: number,
    reason: string,
    taxHistory: TaxHistory[]
}