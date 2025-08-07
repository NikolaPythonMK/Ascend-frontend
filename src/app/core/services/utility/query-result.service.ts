import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QueryResult } from '../../../features/report-table/report-table.component';

@Injectable({ providedIn: 'root' })
export class QueryResultService {
  private queryResultSubject = new BehaviorSubject<QueryResult | null>(null);
  queryResult$ = this.queryResultSubject.asObservable();

  setQueryResult(result: QueryResult) {
    this.queryResultSubject.next(result);
  }

  clearQueryResult() {
    this.queryResultSubject.next(null);
  }
}
