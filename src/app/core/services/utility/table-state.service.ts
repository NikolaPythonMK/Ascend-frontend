import { Injectable, signal } from "@angular/core";
import { SearchTerm } from "../../models/api/search-term.model";
import { Sort } from "../../ui/table/models/sort.model";

@Injectable({
    providedIn: 'root'
})
export class TableStateService {
    searchTerm = signal<SearchTerm[]>([]);
    sort = signal<Sort | undefined>(undefined);
    view = signal<string>('table')

    setSort(sort: Sort | null, map: Map<string, string>) {
      this.sort.set(
        sort
          ? { propName: map.get(sort.propName)!, direction: sort.direction }
          : undefined
      );
    }
    
      setSearch(term: string, colDisplayNames: string[], nonSearchableColumns: string[], map: Map<string, string>) {
        const searchTerm = colDisplayNames
          .filter(i => !nonSearchableColumns.includes(i))
          .map(i => ({
            propName: map.get(i)!.charAt(0).toUpperCase() + map.get(i)!.slice(1),
            searchValue: term
          }));
    
        this.searchTerm.set(searchTerm);
      }

}