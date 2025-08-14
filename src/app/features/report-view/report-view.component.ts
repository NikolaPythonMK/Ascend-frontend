import { Component, inject, input, OnInit, signal } from '@angular/core';
import {
  QueryResult,
  QueryResultsDisplayComponent,
} from '../report-table/report-table.component';
import { LoaderComponent } from '../../core/ui/loader/loader.component';
import { QueryResultService } from '../../core/services/utility/query-result.service';
import { ReportingService } from '../../core/services/api/reporting.service';
import { DynamicQuery } from '../reports-dashboard/report-dashboard.component';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';

@Component({
  selector: 'report-view',
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.scss'],
  standalone: true,
  imports: [QueryResultsDisplayComponent, LoaderComponent],
})
export class ReportViewComponent implements OnInit {
  private readonly queryResultService = inject(QueryResultService);
  private readonly reportingService = inject(ReportingService);

  queryRequest = signal<DynamicQuery | null>(null);
  queryResult = signal<QueryResult | null>(null);
  reportId = signal<number | null>(null);

  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loading.set(true);

    this.queryResultService.queryRequest$.subscribe((result) => {
      this.queryRequest.set(result);

      if (!result) {
        console.warn('No query request passed.');
      }

      this.loading.set(false);
    });

    this.queryResultService.queryResult$.subscribe((result) => {
      this.queryResult.set(result);

      if (!result) {
        console.warn('No query result passed.');
      }

      this.loading.set(false);
    });

    this.queryResultService.reportId$.subscribe((result) => {
      this.reportId.set(result);

      if (!result) {
        console.warn('No report id passed.');
      }

      this.loading.set(false);
    });
  }

  refreshData() {
    this.reportingService
      .execute(this.queryRequest()!)
      .pipe()
      .subscribe({
        next: (result: any) => {
          if (result?.result) {
            this.queryResultService.setQueryResult(
              this.queryRequest()!,
              result.result!,
              this.reportId()!
            );
            this.queryResult.set(result.result!);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Query execution failed:', error);
          return of(null);
        },
      });
  }
}
