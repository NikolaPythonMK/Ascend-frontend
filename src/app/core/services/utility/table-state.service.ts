import { Injectable, signal } from "@angular/core";
import { SearchTerm } from "../../models/api/search-term.model";
import { Sort } from "../../ui/table/models/sort.model";
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class 
TableStateService {
    searchTerm = signal<SearchTerm[]>([]);
    sort = signal<Sort | undefined>(undefined);
    view = new BehaviorSubject<string>('table')

    setSort(sort: Sort | null, map: Map<string, string>) {
      this.sort.set(
        sort
          ? { propName: map.get(sort.propName)!, direction: sort.direction }
          : undefined
      );
    }
    
      setSearch(term: string, colDisplayNames: string[], nonSearchableColumns: string[], map: Map<string, string>) {
        const propName = colDisplayNames
          .filter(i => !nonSearchableColumns.includes(i))
          .map(i => map.get(i))
          .filter((property): property is string => property != null)
          .map(property => property.charAt(0).toUpperCase() + property.slice(1))
          .join(';');

        this.searchTerm.set(
          propName
            ? [{ propName, searchValue: term }]
            : []
        );
      }

}
