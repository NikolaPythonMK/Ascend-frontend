// Define the state of the store
export type EmployeeState = {
    id: number | null,
    code: number | null,
    permissions: string[],
    language: string | null
}