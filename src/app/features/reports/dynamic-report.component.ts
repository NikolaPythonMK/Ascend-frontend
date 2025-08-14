import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TrackByFunction,
  inject,
  signal,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  catchError,
  finalize,
} from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { QueryResultsDisplayComponent } from '../report-table/report-table.component';
import { ReportingService } from '../../core/services/api/reporting.service';
import { ReportRequest } from '../../core/models/api/requests/report.request';
import { SnackbarService } from '../../core/services/utility/snackbar.service';
import TranslationService from '../../core/services/utility/translation.service';
import { QueryResultService } from '../../core/services/utility/query-result.service';

// Optimized interfaces
export interface EntityInfo {
  name: string;
  displayName: string;
}

export interface PropertyInfo {
  name: string;
  type: string;
  isCollection: boolean;
  isNavigation: boolean;
  relatedEntity?: string;
  displayName: string;
  path: string;
}

interface FilterOperator {
  value: string;
  label: string;
  supportedTypes: string[];
  icon?: string;
}

interface AggregateOperation {
  value: string;
  label: string;
  requiresField: boolean;
  icon?: string;
}

interface QueryResult {
  data: any[];
  count: number;
  aggregates?: { [key: string]: number };
  totalAggregates?: { [key: string]: number };
}

interface PropertyGroup {
  label: string;
  properties: PropertyInfo[];
  expanded?: boolean;
}

@Component({
  selector: 'app-dynamic-query-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dynamic-report.component.html',
  styleUrls: ['./dynamic-report.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    QueryResultsDisplayComponent,
    FormsModule,
  ],
})
export class DynamicQueryBuilderComponent implements OnInit, OnDestroy {
  private readonly reportingService = inject(ReportingService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly translationService = inject(TranslationService);
  private readonly queryResultService = inject(QueryResultService);

  reportName = signal<string>('');
  queryForm: FormGroup;
  entities: EntityInfo[] = [];
  allProperties: PropertyInfo[] = [];
  navigationProperties: PropertyInfo[] = [];
  groupedProperties: PropertyGroup[] = [];
  queryResult: QueryResult | null = null;
  loading = false;

  pageSize = 25;
  currentPage = 0;
  paginatedData: any[] = [];

  private destroy$ = new Subject<void>();
  private propertiesCache = new Map<string, PropertyInfo[]>();

  filterOperators: FilterOperator[] = [
    {
      value: '==',
      label: 'Equals',
      supportedTypes: ['string', 'number', 'boolean', 'date'],
      icon: 'drag_handle',
    },
    {
      value: '!=',
      label: 'Not Equals',
      supportedTypes: ['string', 'number', 'boolean', 'date'],
      icon: 'not_equal',
    },
    {
      value: '>',
      label: 'Greater Than',
      supportedTypes: ['number', 'date'],
      icon: 'keyboard_arrow_right',
    },
    {
      value: '>=',
      label: 'Greater Than or Equal',
      supportedTypes: ['number', 'date'],
      icon: 'keyboard_double_arrow_right',
    },
    {
      value: '<',
      label: 'Less Than',
      supportedTypes: ['number', 'date'],
      icon: 'keyboard_arrow_left',
    },
    {
      value: '<=',
      label: 'Less Than or Equal',
      supportedTypes: ['number', 'date'],
      icon: 'keyboard_double_arrow_left',
    },
    {
      value: 'Contains',
      label: 'Contains',
      supportedTypes: ['string'],
      icon: 'search',
    },
    {
      value: 'StartsWith',
      label: 'Starts With',
      supportedTypes: ['string'],
      icon: 'west',
    },
    {
      value: 'EndsWith',
      label: 'Ends With',
      supportedTypes: ['string'],
      icon: 'east',
    },
    {
      value: 'In',
      label: 'In List',
      supportedTypes: ['string', 'number'],
      icon: 'list',
    },
  ];

  aggregateOperations: AggregateOperation[] = [
    { value: 'Sum', label: 'Sum', requiresField: true, icon: 'add' },
    {
      value: 'Average',
      label: 'Average',
      requiresField: true,
      icon: 'trending_flat',
    },
    { value: 'Count', label: 'Count', requiresField: false, icon: 'numbers' },
    {
      value: 'Min',
      label: 'Minimum',
      requiresField: true,
      icon: 'keyboard_arrow_down',
    },
    {
      value: 'Max',
      label: 'Maximum',
      requiresField: true,
      icon: 'keyboard_arrow_up',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.queryForm = this.createForm();
  }

  ngOnInit() {
    this.queryResultService.clearQueryResult();
    this.loadEntities();
    this.setupFormSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByEntityName: TrackByFunction<EntityInfo> = (index, item) => item.name;
  trackByPropertyPath: TrackByFunction<PropertyInfo> = (index, item) =>
    item.path;
  trackByGroupLabel: TrackByFunction<PropertyGroup> = (index, item) =>
    item.label;
  trackByIndex: TrackByFunction<any> = (index) => index;
  trackByString: TrackByFunction<string> = (index, item) => item;
  trackByOperatorValue: TrackByFunction<FilterOperator> = (index, item) =>
    item.value;
  trackByAggregateValue: TrackByFunction<AggregateOperation> = (index, item) =>
    item.value;

  createForm(): FormGroup {
    return this.fb.group({
      rootEntity: ['', Validators.required],
      includes: [[]],
      filters: this.fb.array([this.createFilterGroup()]),
      selectFields: [[]],
      aggregates: this.fb.array([]),
      totalAggregates: this.fb.array([]),
      orderBy: this.fb.array([]),
      skip: [null, [Validators.min(0)]],
      take: [100, [Validators.min(1), Validators.max(10000)]],
    });
  }

  setupFormSubscriptions() {
    // Auto-save form state or debounce expensive operations
    this.queryForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        // Could implement auto-save here
        this.cdr.markForCheck();
      });
  }

  createFilterGroup(): FormGroup {
    return this.fb.group({
      operator: ['AND'],
      individualFilters: this.fb.array([this.createFilter()]),
    });
  }

  createFilter(): FormGroup {
    return this.fb.group({
      field: ['', Validators.required],
      operator: ['==', Validators.required],
      value: ['', Validators.required],
    });
  }

  createAggregate(): FormGroup {
    return this.fb.group({
      operation: ['Sum', Validators.required],
      field: [''],
      alias: ['', Validators.required],
    });
  }

  createOrderBy(): FormGroup {
    return this.fb.group({
      field: ['', Validators.required],
      direction: ['ASC', Validators.required],
    });
  }

  // Getters for FormArrays
  get filtersArray(): FormArray {
    return this.queryForm.get('filters') as FormArray;
  }

  get aggregatesArray(): FormArray {
    return this.queryForm.get('aggregates') as FormArray;
  }

  get totalAggregatesArray(): FormArray {
    return this.queryForm.get('totalAggregates') as FormArray;
  }

  get orderByArray(): FormArray {
    return this.queryForm.get('orderBy') as FormArray;
  }

  getIndividualFilters(groupIndex: number): FormArray {
    return this.filtersArray
      .at(groupIndex)
      .get('individualFilters') as FormArray;
  }

  // API calls with error handling
  loadEntities() {
    this.reportingService
      .getEntities()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.showError('Failed to load entities');
          return of([]);
        })
      )
      .subscribe((entities) => {
        this.entities = entities;
        this.cdr.markForCheck();
      });
  }

  onEntityChange(entityName: string) {
    if (this.propertiesCache.has(entityName)) {
      this.setProperties(this.propertiesCache.get(entityName)!);
      return;
    }

    this.reportingService
      .getEntityDetails(entityName)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          this.showError('Failed to load entity properties');
          return of([]);
        })
      )
      .subscribe((properties) => {
        this.propertiesCache.set(entityName, properties);
        this.setProperties(properties);
      });
  }

  private setProperties(properties: PropertyInfo[]) {
    this.allProperties = properties;
    this.navigationProperties = properties.filter((p) => p.isNavigation);
    this.groupProperties();
    this.resetForm();
    this.cdr.markForCheck();
  }

  private resetForm() {
    // Clear dependent form controls when entity changes
    this.queryForm.patchValue({
      includes: [],
      selectFields: [],
    });

    // Clear arrays
    while (this.aggregatesArray.length > 0) {
      this.aggregatesArray.removeAt(0);
    }
    while (this.totalAggregatesArray.length > 0) {
      this.totalAggregatesArray.removeAt(0);
    }
    while (this.orderByArray.length > 0) {
      this.orderByArray.removeAt(0);
    }

    // Reset filters
    while (this.filtersArray.length > 0) {
      this.filtersArray.removeAt(0);
    }
    this.filtersArray.push(this.createFilterGroup());

    this.queryResult = null;
  }

  groupProperties() {
    if (!this.allProperties.length) {
      this.groupedProperties = [];
      return;
    }

    const groups = new Map<string, PropertyInfo[]>();

    this.allProperties.forEach((prop) => {
      const groupName = prop.path.includes('.')
        ? prop.path.substring(0, prop.path.lastIndexOf('.'))
        : 'Root Properties';

      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(prop);
    });

    this.groupedProperties = Array.from(groups.entries()).map(
      ([label, properties]) => ({
        label,
        properties: properties.sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
        ),
        expanded: label === 'Root Properties',
      })
    );
  }

  getNumericProperties(): PropertyGroup[] {
    return this.groupedProperties
      .map((group) => ({
        ...group,
        properties: group.properties.filter((p) =>
          ['int', 'decimal', 'double', 'float', 'long'].includes(
            p.type.toLowerCase()
          )
        ),
      }))
      .filter((group) => group.properties.length > 0);
  }

  // Helper methods for UI state
  getSelectedIncludes(): string[] {
    return this.queryForm.get('includes')?.value || [];
  }

  getSelectedFields(): string[] {
    return this.queryForm.get('selectFields')?.value || [];
  }

  getTotalFiltersCount(): number {
    return this.filtersArray.controls.reduce((total: any, group: any) => {
      return (
        total +
        this.getIndividualFilters(this.filtersArray.controls.indexOf(group))
          .length
      );
    }, 0);
  }

  getAggregateCount(): number {
    const aggregates = this.queryResult?.aggregates
      ? Object.keys(this.queryResult.aggregates).length
      : 0;
    const totalAggregates = this.queryResult?.totalAggregates
      ? Object.keys(this.queryResult.totalAggregates).length
      : 0;
    return aggregates + totalAggregates;
  }

  isIncludeSelected(includeName: string): boolean {
    return this.getSelectedIncludes().includes(includeName);
  }

  isFieldSelected(fieldPath: string): boolean {
    return this.getSelectedFields().includes(fieldPath);
  }

  toggleInclude(includeName: string) {
    const current = this.getSelectedIncludes();
    const updated = current.includes(includeName)
      ? current.filter((i) => i !== includeName)
      : [...current, includeName];
    this.queryForm.patchValue({ includes: updated });
  }

  toggleField(fieldPath: string) {
    const current = this.getSelectedFields();
    const updated = current.includes(fieldPath)
      ? current.filter((f) => f !== fieldPath)
      : [...current, fieldPath];
    this.queryForm.patchValue({ selectFields: updated });
  }

  selectAllFields() {
    const allPaths = this.allProperties.map((p) => p.path);
    this.queryForm.patchValue({ selectFields: allPaths });
  }

  clearSelectedFields() {
    this.queryForm.patchValue({ selectFields: [] });
  }

  // Form manipulation methods
  addFilterGroup() {
    this.filtersArray.push(this.createFilterGroup());
  }

  removeFilterGroup(index: number) {
    if (this.filtersArray.length > 1) {
      this.filtersArray.removeAt(index);
    }
  }

  addFilter(groupIndex: number) {
    this.getIndividualFilters(groupIndex).push(this.createFilter());
  }

  removeFilter(groupIndex: number, filterIndex: number) {
    const individualFilters = this.getIndividualFilters(groupIndex);
    if (individualFilters.length > 1) {
      individualFilters.removeAt(filterIndex);
    }
  }

  addAggregate() {
    this.aggregatesArray.push(this.createAggregate());
  }

  removeAggregate(index: number) {
    this.aggregatesArray.removeAt(index);
  }

  addTotalAggregate() {
    this.totalAggregatesArray.push(this.createAggregate());
  }

  removeTotalAggregate(index: number) {
    this.totalAggregatesArray.removeAt(index);
  }

  addOrderBy() {
    this.orderByArray.push(this.createOrderBy());
  }

  removeOrderBy(index: number) {
    this.orderByArray.removeAt(index);
  }

  // Enhanced helper methods
  onFieldChange(groupIndex: number, filterIndex: number, fieldPath: string) {
    const property = this.allProperties.find((p) => p.path === fieldPath);
    if (property) {
      const operators = this.getAvailableOperators(groupIndex, filterIndex);
      if (operators.length > 0) {
        this.getIndividualFilters(groupIndex).at(filterIndex).patchValue({
          operator: operators[0].value,
          value: '', // Clear value when field changes
        });
      }
    }
  }

  onAggregateOperationChange(index: number, operation: string) {
    const aggregateOp = this.aggregateOperations.find(
      (op) => op.value === operation
    );
    const fieldControl = this.aggregatesArray.at(index).get('field');

    if (aggregateOp?.requiresField) {
      fieldControl?.setValidators(Validators.required);
    } else {
      fieldControl?.clearValidators();
      fieldControl?.setValue('Id');
    }
    fieldControl?.updateValueAndValidity();
  }

  getAvailableOperators(
    groupIndex: number,
    filterIndex: number
  ): FilterOperator[] {
    const fieldPath = this.getIndividualFilters(groupIndex)
      .at(filterIndex)
      .get('field')?.value;
    const property = this.allProperties.find((p) => p.path === fieldPath);

    if (!property) return this.filterOperators;

    return this.filterOperators.filter((op) =>
      op.supportedTypes.includes(this.mapToGenericType(property.type))
    );
  }

  mapToGenericType(type: string): string {
    const lowerType = type.toLowerCase();
    if (['int', 'decimal', 'double', 'float', 'long'].includes(lowerType))
      return 'number';
    if (['datetime', 'date'].includes(lowerType)) return 'date';
    if (['bool', 'boolean'].includes(lowerType)) return 'boolean';
    return 'string';
  }

  getInputType(groupIndex: number, filterIndex: number): string {
    const fieldPath = this.getIndividualFilters(groupIndex)
      .at(filterIndex)
      .get('field')?.value;
    const property = this.allProperties.find((p) => p.path === fieldPath);

    if (!property) return 'text';

    const genericType = this.mapToGenericType(property.type);
    switch (genericType) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  }

  getPlaceholder(groupIndex: number, filterIndex: number): string {
    const operator = this.getIndividualFilters(groupIndex)
      .at(filterIndex)
      .get('operator')?.value;
    const fieldPath = this.getIndividualFilters(groupIndex)
      .at(filterIndex)
      .get('field')?.value;
    const property = this.allProperties.find((p) => p.path === fieldPath);

    if (operator === 'In') return 'Enter comma-separated values';
    if (property) {
      const genericType = this.mapToGenericType(property.type);
      switch (genericType) {
        case 'number':
          return 'Enter number';
        case 'date':
          return 'Select date';
        case 'boolean':
          return 'true/false';
        default:
          return 'Enter text';
      }
    }
    return 'Enter value';
  }

  requiresField(index: number): boolean {
    const operation = this.aggregatesArray.at(index).get('operation')?.value;
    return (
      this.aggregateOperations.find((op) => op.value === operation)
        ?.requiresField || false
    );
  }

  // Query execution with better error handling
  executeQuery() {
    this.loading = true;
    const queryData = this.buildQueryObject();

    this.reportingService
      .execute(queryData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (result: any) => {
          if (result?.result) {
            this.queryResult = result.result;
            this.updatePaginatedData();
            this.showSuccess(
              `Query executed successfully. Found ${
                this.queryResult?.count || 0
              } records.`
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Query execution failed:', error);
          this.showError(
            'Query execution failed. Please check your parameters.'
          );
          return of(null);
        },
      });
  }

  buildQueryObject(): any {
    const formValue = this.queryForm.value;

    return {
      rootEntity: formValue.rootEntity,
      includes: formValue.includes || [],
      filters: this.buildFilters(formValue.filters),
      selectFields: formValue.selectFields || [],
      aggregates: formValue.aggregates || [],
      totalAggregates: formValue.totalAggregates || [],
      orderBy: formValue.orderBy || [],
      skip: formValue.skip || 0,
      take: formValue.take || 100,
    };
  }

  buildFilters(filterGroups: any[]): any {
    if (!filterGroups || filterGroups.length === 0) return null;

    const mainGroup = {
      operator: 'AND',
      filters: [] as any[],
      groups: [] as any[],
    };

    filterGroups.forEach((group) => {
      if (group.individualFilters && group.individualFilters.length > 0) {
        const validFilters = group.individualFilters.filter(
          (f: any) => f.field && f.operator && f.value
        );
        if (validFilters.length > 0) {
          mainGroup.groups.push({
            operator: group.operator,
            filters: validFilters,
            groups: [],
          });
        }
      }
    });

    return mainGroup.groups.length > 0 ? mainGroup : null;
  }

  clearQuery() {
    this.queryForm.reset();
    this.queryForm = this.createForm();
    this.queryResult = null;
    this.paginatedData = [];
    this.currentPage = 0;
    this.allProperties = [];
    this.navigationProperties = [];
    this.groupedProperties = [];
    this.cdr.markForCheck();
    this.showSuccess('Query cleared successfully');
  }

  // Pagination methods
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  private updatePaginatedData() {
    if (!this.queryResult?.data) {
      this.paginatedData = [];
      return;
    }

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.queryResult.data.slice(startIndex, endIndex);
    this.cdr.markForCheck();
  }

  // Display helpers
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getDataColumns(): string[] {
    if (!this.queryResult?.data || this.queryResult.data.length === 0) {
      return [];
    }
    return Object.keys(this.queryResult.data[0]);
  }

  getNestedValue(row: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], row);
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  // Performance optimization methods
  private debounceExecution = this.debounce(
    (callback: () => void) => callback(),
    300
  );

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  createReport() {
    const queryObject = this.buildQueryObject();

    const reportRequest: ReportRequest = {
      name: this.reportName(),
      requestData: JSON.stringify(queryObject, null, 2),
      id: 0,
    };

    this.reportingService.add(reportRequest).subscribe({
      next: () => {
        this.snackbarService.success(
          `${this.translationService.getTranslationForKey(
            'shared.succesfully'
          )} ${this.translationService.getTranslationForKey('shared.added')}`
        );
        this.clearQuery();
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      },
    });
  }
}
