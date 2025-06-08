export interface SelectListElement {
    name: string,
    id: number
}

export interface FilterDialogData {
    selectList: SelectListElement[],
    title: string
}