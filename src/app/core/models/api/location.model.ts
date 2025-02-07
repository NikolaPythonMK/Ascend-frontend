import { Table } from "./table.model";

export interface Location {
    id: number,
    name: string,
    tables?: Table[],
    transactions?: any
}