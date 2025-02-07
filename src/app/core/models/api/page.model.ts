export interface Page<T> {
    data: T[],
    count: number,
    pages: number
}