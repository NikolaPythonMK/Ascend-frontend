import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatPaginator,
  PageEvent,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportingService } from '../../core/services/api/reporting.service';
import { ReportRequest } from '../../core/models/api/requests/report.request';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { QueryResultService } from '../../core/services/utility/query-result.service';

export interface QueryResult {
  data?: any[];
  count?: number;
  aggregates?: { [key: string]: number };
  totalAggregates?: { [key: string]: number };
}

export interface DisplayColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

@Component({
  selector: 'report-table',
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
})
export class QueryResultsDisplayComponent implements OnInit, OnChanges {
  @Input() queryResult: QueryResult | null = null;
  @Input() reportId: number | null = null;
  @Input() title: string = 'Query Results';
  @Input() showSummary: boolean = true;
  @Input() showAggregates: boolean = true;
  @Input() showDataTable: boolean = true;
  @Input() customColumns: DisplayColumn[] = [];
  @Input() pageSize: number = 25;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() loading: boolean = false;
  @Input() showActions: boolean = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly queryResultService = inject(QueryResultService);
  private readonly reportingService = inject(ReportingService);
  
  onRefreshEvent = output<void>()
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  aggregateKeys: string[] = [];
  totalAggregateKeys: string[] = [];

  ngOnInit() {
    this.queryResultService.queryResult$.subscribe((result) => {
      this.queryResult = result;

      if (!result) {
        console.warn('No query result passed.');
      }
    });
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['queryResult'] && this.queryResult) {
      this.updateDataDisplay();
    }
  }

  private initializeComponent() {
    if (this.queryResult) {
      this.updateDataDisplay();
    }
  }

  private updateDataDisplay() {
    if (!this.queryResult) return;

    // Update data source
    this.dataSource.data = this.queryResult.data || [];
    this.dataSource.paginator = this.paginator;

    // Update displayed columns
    this.displayedColumns = this.getDataColumns();

    // Update aggregate keys
    this.aggregateKeys = this.queryResult.aggregates
      ? Object.keys(this.queryResult.aggregates)
      : [];
    this.totalAggregateKeys = this.queryResult.totalAggregates
      ? Object.keys(this.queryResult.totalAggregates)
      : [];
  }

  getDataColumns(): string[] {
    if (this.customColumns.length > 0) {
      return this.customColumns.map((col) => col.key);
    }

    if (!this.queryResult?.data || this.queryResult.data.length === 0) {
      return [];
    }

    // Extract columns from the first data row
    const firstRow = this.queryResult.data[0];
    return this.extractColumnsFromObject(firstRow);
  }

  private extractColumnsFromObject(obj: any, prefix: string = ''): string[] {
    const columns: string[] = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          // Nested object - add nested columns
          columns.push(...this.extractColumnsFromObject(value, fullKey));
        } else if (!Array.isArray(value)) {
          // Simple value - add as column
          columns.push(fullKey);
        }
      }
    }

    return columns;
  }

  getColumnLabel(column: string): string {
    const customColumn = this.customColumns.find((col) => col.key === column);
    if (customColumn) {
      return customColumn.label;
    }

    // Convert dot notation to readable format
    return column
      .split('.')
      .map((part) => part.replace(/([A-Z])/g, ' $1').trim())
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' > ');
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === 'number') {
      // Check if it's a decimal number
      if (value % 1 !== 0) {
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return value.toLocaleString();
    }

    if (typeof value === 'string') {
      // Limit string length for display
      return value.length > 100 ? value.substring(0, 100) + '...' : value;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  getRecordCount(): number {
    return this.queryResult?.count || this.queryResult?.data?.length || 0;
  }

  getAggregateCount(): number {
    const aggregatesCount = this.aggregateKeys.length;
    const totalAggregatesCount = this.totalAggregateKeys.length;
    return aggregatesCount + totalAggregatesCount;
  }

  hasData(): boolean {
    return !!(this.queryResult?.data && this.queryResult.data.length > 0);
  }

  hasAggregates(): boolean {
    return this.aggregateKeys.length > 0 || this.totalAggregateKeys.length > 0;
  }

  onPageChange(event: PageEvent) {
    // Handle pagination if needed
    // This is already handled by MatTableDataSource automatically
  }

  exportData(format: 'csv' | 'json' | 'excel' | 'pdf') {
    if (!this.hasData()) return;

    switch (format) {
      case 'csv':
        this.exportToCsv();
        break;
      case 'json':
        this.exportToJson();
        break;
      case 'excel':
        this.exportToExcel();
        break;
      case 'pdf':
        this.exportToPdf();
        break;
    }
  }

  refreshData(): void{
    this.onRefreshEvent.emit();
  }

  private exportToPdf() {
    const request: ReportRequest = {
      id: this.reportId!,
      name: '',
      requestData: ''
    }

    this.reportingService
      .exportPdf(request)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (result: any) => {
          console.error('Success');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Fail', error);
        },
      });
  }

  private exportToCsv() {
    const request: ReportRequest = {
      id: this.reportId!,
      name: '',
      requestData: ''
    }

    this.reportingService
      .exportCsv(request)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (result: any) => {
          console.error('Success');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Fail', error);
        },
      });
  }

  private exportToJson() {
    const request: ReportRequest = {
      id: this.reportId!,
      name: '',
      requestData: ''
    }

    this.reportingService
      .exportJson(request)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (result: any) => {
          console.error('Success');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Fail', error);
        },
      });
  }

  private exportToExcel() {
    const request: ReportRequest = {
      id: this.reportId!,
      name: '',
      requestData: ''
    }

    this.reportingService
      .exportExcel(request)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (result: any) => {
          console.error('Success');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Fail', error);
        },
      });
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // TrackBy functions for performance
  trackByString(index: number, item: string): string {
    return item;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  trackByAggregateKey(index: number, key: string): string {
    return key;
  }
}
