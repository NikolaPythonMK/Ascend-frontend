import { Injectable } from "@angular/core";
import { SearchTerm } from "../../models/api/search-term.model";


@Injectable({
    providedIn: 'root'
})
export class FilterDataService {
    createSearchTermFilter(searchTerm: string, properties: string[]): SearchTerm[] {
        return properties.map(prop => ({
            propName: prop,
            searchValue: searchTerm
        }));
    }
}