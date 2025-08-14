import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { QueryResult } from '../../../features/report-table/report-table.component';
import { DynamicQuery } from '../../../features/reports-dashboard/report-dashboard.component';

@Injectable({ providedIn: 'root' })
export class QueryResultService {
  private queryRequestSubject = new BehaviorSubject<DynamicQuery | null>(null);
  private queryResultSubject = new BehaviorSubject<QueryResult | null>(null);
  private reportIdSubject = new BehaviorSubject<number | null>(null);

  queryRequest$ = this.queryRequestSubject.asObservable();
  queryResult$ = this.queryResultSubject.asObservable();
  reportId$ = this.reportIdSubject.asObservable();

  setQueryResult(request: DynamicQuery, response: QueryResult, reportId: number) {
    this.queryRequestSubject.next(request);
    this.queryResultSubject.next(response);
    this.reportIdSubject.next(reportId);
  }

  clearQueryResult() {
    this.queryRequestSubject.next(null);
    this.queryResultSubject.next(null);
    this.reportIdSubject.next(null);
  }
}
