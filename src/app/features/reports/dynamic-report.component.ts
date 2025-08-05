import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardHeader, MatCardModule, MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, MatSelect } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatOptgroup, MatOption } from "@angular/material/core";
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
interface EntityInfo {
  name: string;
  displayName: string;
}

interface PropertyInfo {
  name: string;
  type: string;
  isCollection: boolean;
  isNavigation: boolean;
  relatedEntity?: string;
  displayName: string;
  path: string; // Full path like "TransactionItems.GrossPrice"
}

interface FilterOperator {
  value: string;
  label: string;
  supportedTypes: string[];
}

interface AggregateOperation {
  value: string;
  label: string;
  requiresField: boolean;
}

@Component({
  selector: 'app-dynamic-query-builder',
  template: `
    <div class="query-builder-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Dynamic Query Builder</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="queryForm">
            
            <!-- Entity Selection -->
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Root Entity</mat-label>
              <mat-select formControlName="rootEntity" (selectionChange)="onEntityChange($event.value)">
                <mat-option *ngFor="let entity of entities" [value]="entity.name">
                  {{entity.displayName}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Includes Section -->
            <div class="section" *ngIf="navigationProperties.length > 0">
              <h3>Include Related Data</h3>
              <mat-selection-list formControlName="includes">
                <mat-list-option *ngFor="let nav of navigationProperties" [value]="nav.name">
                  {{nav.displayName}}
                </mat-list-option>
              </mat-selection-list>
            </div>

            <!-- Filters Section -->
            <div class="section">
              <h3>Filters</h3>
              <div formArrayName="filters">
                <div *ngFor="let filterGroup of filtersArray.controls; let i = index" 
                     [formGroupName]="i" class="filter-group">
                  
                  <mat-form-field appearance="fill">
                    <mat-label>Logic Operator</mat-label>
                    <mat-select formControlName="operator">
                      <mat-option value="AND">AND</mat-option>
                      <mat-option value="OR">OR</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Individual Filters -->
                  <div formArrayName="individualFilters">
                    <div *ngFor="let filter of getIndividualFilters(i).controls; let j = index"
                         [formGroupName]="j" class="individual-filter">
                      
                      <mat-form-field appearance="fill">
                        <mat-label>Field</mat-label>
                        <mat-select formControlName="field" (selectionChange)="onFieldChange(i, j, $event.value)">
                          <mat-optgroup *ngFor="let group of groupedProperties" [label]="group.label">
                            <mat-option *ngFor="let prop of group.properties" [value]="prop.path">
                              {{prop.displayName}}
                            </mat-option>
                          </mat-optgroup>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="fill">
                        <mat-label>Operator</mat-label>
                        <mat-select formControlName="operator">
                          <mat-option *ngFor="let op of getAvailableOperators(i, j)" [value]="op.value">
                            {{op.label}}
                          </mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-form-field appearance="fill">
                        <mat-label>Value</mat-label>
                        <input matInput formControlName="value" 
                               [type]="getInputType(i, j)"
                               [placeholder]="getPlaceholder(i, j)">
                      </mat-form-field>

                      <button mat-icon-button color="warn" (click)="removeFilter(i, j)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>

                  <button mat-raised-button color="primary" (click)="addFilter(i)">
                    Add Filter
                  </button>
                  
                  <button mat-icon-button color="warn" (click)="removeFilterGroup(i)" 
                          *ngIf="filtersArray.length > 1">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <button mat-raised-button color="accent" (click)="addFilterGroup()">
                Add Filter Group
              </button>
            </div>

            <!-- Select Fields Section -->
            <div class="section">
              <h3>Select Fields</h3>
              <mat-selection-list formControlName="selectFields" [multiple]="true">
                <mat-optgroup *ngFor="let group of groupedProperties" [label]="group.label">
                  <mat-list-option *ngFor="let prop of group.properties" [value]="prop.path">
                    {{prop.displayName}}
                  </mat-list-option>
                </mat-optgroup>
              </mat-selection-list>
            </div>

            <!-- Aggregates Section -->
            <div class="section">
              <h3>Aggregates (Filtered Data)</h3>
              <div formArrayName="aggregates">
                <div *ngFor="let agg of aggregatesArray.controls; let i = index" 
                     [formGroupName]="i" class="aggregate-item">
                  
                  <mat-form-field appearance="fill">
                    <mat-label>Operation</mat-label>
                    <mat-select formControlName="operation" (selectionChange)="onAggregateOperationChange(i, $event.value)">
                      <mat-option *ngFor="let op of aggregateOperations" [value]="op.value">
                        {{op.label}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="fill" *ngIf="requiresField(i)">
                    <mat-label>Field</mat-label>
                    <mat-select formControlName="field">
                      <mat-optgroup *ngFor="let group of getNumericProperties()" [label]="group.label">
                        <mat-option *ngFor="let prop of group.properties" [value]="prop.path">
                          {{prop.displayName}}
                        </mat-option>
                      </mat-optgroup>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="fill">
                    <mat-label>Alias</mat-label>
                    <input matInput formControlName="alias" placeholder="Result name">
                  </mat-form-field>

                  <button mat-icon-button color="warn" (click)="removeAggregate(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <button mat-raised-button color="primary" (click)="addAggregate()">
                Add Aggregate
              </button>
            </div>

            <!-- Total Aggregates Section -->
            <div class="section">
              <h3>Total Aggregates (All Data)</h3>
              <div formArrayName="totalAggregates">
                <div *ngFor="let agg of totalAggregatesArray.controls; let i = index" 
                     [formGroupName]="i" class="aggregate-item">
                  
                  <mat-form-field appearance="fill">
                    <mat-label>Operation</mat-label>
                    <mat-select formControlName="operation">
                      <mat-option *ngFor="let op of aggregateOperations" [value]="op.value">
                        {{op.label}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="fill">
                    <mat-label>Field</mat-label>
                    <mat-select formControlName="field">
                      <mat-optgroup *ngFor="let group of getNumericProperties()" [label]="group.label">
                        <mat-option *ngFor="let prop of group.properties" [value]="prop.path">
                          {{prop.displayName}}
                        </mat-option>
                      </mat-optgroup>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="fill">
                    <mat-label>Alias</mat-label>
                    <input matInput formControlName="alias" placeholder="Result name">
                  </mat-form-field>

                  <button mat-icon-button color="warn" (click)="removeTotalAggregate(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <button mat-raised-button color="primary" (click)="addTotalAggregate()">
                Add Total Aggregate
              </button>
            </div>

            <!-- Order By Section -->
            <div class="section">
              <h3>Order By</h3>
              <div formArrayName="orderBy">
                <div *ngFor="let order of orderByArray.controls; let i = index" 
                     [formGroupName]="i" class="order-item">
                  
                  <mat-form-field appearance="fill">
                    <mat-label>Field</mat-label>
                    <mat-select formControlName="field">
                      <mat-optgroup *ngFor="let group of groupedProperties" [label]="group.label">
                        <mat-option *ngFor="let prop of group.properties" [value]="prop.path">
                          {{prop.displayName}}
                        </mat-option>
                      </mat-optgroup>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="fill">
                    <mat-label>Direction</mat-label>
                    <mat-select formControlName="direction">
                      <mat-option value="ASC">Ascending</mat-option>
                      <mat-option value="DESC">Descending</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <button mat-icon-button color="warn" (click)="removeOrderBy(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
              
              <button mat-raised-button color="primary" (click)="addOrderBy()">
                Add Order By
              </button>
            </div>

            <!-- Pagination -->
            <div class="section">
              <h3>Pagination</h3>
              <div class="pagination-controls">
                <mat-form-field appearance="fill">
                  <mat-label>Skip</mat-label>
                  <input matInput type="number" formControlName="skip" placeholder="Records to skip">
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Take</mat-label>
                  <input matInput type="number" formControlName="take" placeholder="Records to take">
                </mat-form-field>
              </div>
            </div>

          </form>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="executeQuery()">
            <mat-icon *ngIf="loading">hourglass_empty</mat-icon>
            Execute Query
          </button>
          
          <button mat-raised-button color="accent" (click)="previewQuery()">
            Preview JSON
          </button>
          
          <button mat-raised-button (click)="clearQuery()">
            Clear All
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Results Section -->
      <mat-card *ngIf="queryResult" class="results-card">
        <mat-card-header>
          <mat-card-title>Query Results</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Aggregates Display -->
          <div *ngIf="queryResult.aggregates" class="aggregates-section">
            <h4>Filtered Aggregates</h4>
            <div class="aggregates-grid">
              <mat-card *ngFor="let agg of objectKeys(queryResult.aggregates)" class="aggregate-card">
                <mat-card-content>
                  <div class="aggregate-label">{{agg}}</div>
                  <div class="aggregate-value">{{queryResult.aggregates[agg] | number}}</div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <div *ngIf="queryResult.totalAggregates" class="aggregates-section">
            <h4>Total Aggregates</h4>
            <div class="aggregates-grid">
              <mat-card *ngFor="let agg of objectKeys(queryResult.totalAggregates)" class="aggregate-card">
                <mat-card-content>
                  <div class="aggregate-label">{{agg}}</div>
                  <div class="aggregate-value">{{queryResult.totalAggregates[agg] | number}}</div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <!-- Data Table -->
          <div *ngIf="queryResult.data && queryResult.data.length > 0" class="data-section">
            <h4>Data ({{queryResult.count}} records)</h4>
            <table mat-table [dataSource]="queryResult.data" class="full-width">
              <ng-container *ngFor="let column of getDataColumns()" [matColumnDef]="column">
                <th mat-header-cell *matHeaderCellDef>{{column}}</th>
                <td mat-cell *matCellDef="let row">{{getNestedValue(row, column)}}</td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="getDataColumns()"></tr>
              <tr mat-row *matRowDef="let row; columns: getDataColumns()"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- JSON Preview Dialog -->
      <div *ngIf="showJsonPreview" class="json-preview-overlay" (click)="showJsonPreview = false">
        <div class="json-preview-dialog" (click)="$event.stopPropagation()">
          <h3>Query JSON Preview</h3>
          <pre>{{jsonPreview}}</pre>
          <button mat-raised-button (click)="showJsonPreview = false">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .query-builder-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }

    .section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .section h3 {
      margin-top: 0;
      color: #1976d2;
    }

    .filter-group {
      margin: 10px 0;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .individual-filter {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 5px 0;
    }

    .individual-filter mat-form-field {
      flex: 1;
    }

    .aggregate-item, .order-item {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 10px 0;
    }

    .aggregate-item mat-form-field, .order-item mat-form-field {
      flex: 1;
    }

    .pagination-controls {
      display: flex;
      gap: 20px;
    }

    .results-card {
      margin-top: 20px;
    }

    .aggregates-section {
      margin: 20px 0;
    }

    .aggregates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin: 10px 0;
    }

    .aggregate-card {
      text-align: center;
    }

    .aggregate-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }

    .aggregate-value {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }

    .data-section {
      margin: 20px 0;
    }

    .json-preview-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .json-preview-dialog {
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 80vw;
      max-height: 80vh;
      overflow: auto;
    }

    .json-preview-dialog pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow: auto;
      white-space: pre-wrap;
    }
  `],
  imports: [CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatProgressSpinnerModule,]
})

export class DynamicQueryBuilderComponent implements OnInit {
  queryForm: FormGroup;
  entities: EntityInfo[] = [];
  allProperties: PropertyInfo[] = [];
  navigationProperties: PropertyInfo[] = [];
  groupedProperties: any[] = [];
  queryResult: any = null;
  loading = false;
  showJsonPreview = false;
  jsonPreview = '';

  filterOperators: FilterOperator[] = [
    { value: '==', label: 'Equals', supportedTypes: ['string', 'number', 'boolean', 'date'] },
    { value: '!=', label: 'Not Equals', supportedTypes: ['string', 'number', 'boolean', 'date'] },
    { value: '>', label: 'Greater Than', supportedTypes: ['number', 'date'] },
    { value: '>=', label: 'Greater Than or Equal', supportedTypes: ['number', 'date'] },
    { value: '<', label: 'Less Than', supportedTypes: ['number', 'date'] },
    { value: '<=', label: 'Less Than or Equal', supportedTypes: ['number', 'date'] },
    { value: 'Contains', label: 'Contains', supportedTypes: ['string'] },
    { value: 'StartsWith', label: 'Starts With', supportedTypes: ['string'] },
    { value: 'EndsWith', label: 'Ends With', supportedTypes: ['string'] },
    { value: 'In', label: 'In List', supportedTypes: ['string', 'number'] }
  ];

  aggregateOperations: AggregateOperation[] = [
    { value: 'Sum', label: 'Sum', requiresField: true },
    { value: 'Average', label: 'Average', requiresField: true },
    { value: 'Count', label: 'Count', requiresField: false },
    { value: 'Min', label: 'Minimum', requiresField: true },
    { value: 'Max', label: 'Maximum', requiresField: true }
  ];

  protected domain = environment.domain;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.queryForm = this.createForm();
  }

  ngOnInit() {
    this.loadEntities();
  }

  createForm(): FormGroup {
    return this.fb.group({
      rootEntity: ['', Validators.required],
      includes: [[]],
      filters: this.fb.array([this.createFilterGroup()]),
      selectFields: [[]],
      aggregates: this.fb.array([]),
      totalAggregates: this.fb.array([]),
      orderBy: this.fb.array([]),
      skip: [null],
      take: [null]
    });
  }

  createFilterGroup(): FormGroup {
    return this.fb.group({
      operator: ['AND'],
      individualFilters: this.fb.array([this.createFilter()])
    });
  }

  createFilter(): FormGroup {
    return this.fb.group({
      field: ['', Validators.required],
      operator: ['==', Validators.required],
      value: ['', Validators.required]
    });
  }

  createAggregate(): FormGroup {
    return this.fb.group({
      operation: ['Sum', Validators.required],
      field: [''],
      alias: ['', Validators.required]
    });
  }

  createOrderBy(): FormGroup {
    return this.fb.group({
      field: ['', Validators.required],
      direction: ['ASC', Validators.required]
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
    return this.filtersArray.at(groupIndex).get('individualFilters') as FormArray;
  }

  // API calls
  loadEntities() {
    this.http.get<EntityInfo[]>('http://localhost:5073/api/entities').subscribe(entities => {
      this.entities = entities;
    });
  }

  onEntityChange(entityName: string) {
    this.http.get<PropertyInfo[]>(`http://localhost:5073/api/entities/${entityName}/properties`).subscribe(properties => {
      this.allProperties = properties;
      this.navigationProperties = properties.filter(p => p.isNavigation);
      this.groupProperties();
    });
  }

  groupProperties() {
    const groups = new Map<string, PropertyInfo[]>();
    
    this.allProperties.forEach(prop => {
      const groupName = prop.path.includes('.') ? 
        prop.path.substring(0, prop.path.lastIndexOf('.')) : 
        'Root Properties';
      
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(prop);
    });

    this.groupedProperties = Array.from(groups.entries()).map(([label, properties]) => ({
      label,
      properties
    }));
  }

  getNumericProperties(): any[] {
    return this.groupedProperties.map(group => ({
      label: group.label,
      properties: group.properties.filter((p: { type: string; }) => 
        ['int', 'decimal', 'double', 'float', 'long'].includes(p.type.toLowerCase())
      )
    })).filter(group => group.properties.length > 0);
  }

  // Form manipulation methods
  addFilterGroup() {
    this.filtersArray.push(this.createFilterGroup());
  }

  removeFilterGroup(index: number) {
    this.filtersArray.removeAt(index);
  }

  addFilter(groupIndex: number) {
    this.getIndividualFilters(groupIndex).push(this.createFilter());
  }

  removeFilter(groupIndex: number, filterIndex: number) {
    this.getIndividualFilters(groupIndex).removeAt(filterIndex);
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

  // Helper methods
  onFieldChange(groupIndex: number, filterIndex: number, fieldPath: string) {
    const property = this.allProperties.find(p => p.path === fieldPath);
    if (property) {
      const operators = this.getAvailableOperators(groupIndex, filterIndex);
      if (operators.length > 0) {
        this.getIndividualFilters(groupIndex).at(filterIndex).get('operator')?.setValue(operators[0].value);
      }
    }
  }

  onAggregateOperationChange(index: number, operation: string) {
    const requiresField = this.aggregateOperations.find(op => op.value === operation)?.requiresField;
    const fieldControl = this.aggregatesArray.at(index).get('field');
    
    if (requiresField) {
      fieldControl?.setValidators(Validators.required);
    } else {
      fieldControl?.clearValidators();
      fieldControl?.setValue('Id');
    }
    fieldControl?.updateValueAndValidity();
  }

  getAvailableOperators(groupIndex: number, filterIndex: number): FilterOperator[] {
    const fieldPath = this.getIndividualFilters(groupIndex).at(filterIndex).get('field')?.value;
    const property = this.allProperties.find(p => p.path === fieldPath);
    
    if (!property) return this.filterOperators;
    
    return this.filterOperators.filter(op => 
      op.supportedTypes.includes(this.mapToGenericType(property.type))
    );
  }

  mapToGenericType(type: string): string {
    const lowerType = type.toLowerCase();
    if (['int', 'decimal', 'double', 'float', 'long'].includes(lowerType)) return 'number';
    if (['datetime', 'date'].includes(lowerType)) return 'date';
    if (['bool', 'boolean'].includes(lowerType)) return 'boolean';
    return 'string';
  }

  getInputType(groupIndex: number, filterIndex: number): string {
    const fieldPath = this.getIndividualFilters(groupIndex).at(filterIndex).get('field')?.value;
    const property = this.allProperties.find(p => p.path === fieldPath);
    
    if (!property) return 'text';
    
    const genericType = this.mapToGenericType(property.type);
    switch (genericType) {
      case 'number': return 'number';
      case 'date': return 'date';
      case 'boolean': return 'checkbox';
      default: return 'text';
    }
  }

  getPlaceholder(groupIndex: number, filterIndex: number): string {
    const operator = this.getIndividualFilters(groupIndex).at(filterIndex).get('operator')?.value;
    if (operator === 'In') return 'Enter comma-separated values';
    return 'Enter value';
  }

  requiresField(index: number): boolean {
    const operation = this.aggregatesArray.at(index).get('operation')?.value;
    return this.aggregateOperations.find(op => op.value === operation)?.requiresField || false;
  }

  // Query execution
  executeQuery() {
  this.loading = true;
  const queryData = this.buildQueryObject();

  this.http.post<any>('http://localhost:5073/api/query/execute', queryData).subscribe({
    next: (result) => {
      console.log('Full result from API:', result);
      this.queryResult = result.result; // <-- THIS IS CRITICAL
      this.loading = false;
    },
    error: (error) => {
      console.error('Query execution failed:', error);
      this.loading = false;
    }
  });
}

  previewQuery() {
    const queryObject = this.buildQueryObject();
    this.jsonPreview = JSON.stringify(queryObject, null, 2);
    this.showJsonPreview = true;
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
      skip: formValue.skip,
      take: formValue.take
    };
  }

  buildFilters(filterGroups: any[]): any {
    if (!filterGroups || filterGroups.length === 0) return null;
    
    const mainGroup = {
      operator: 'AND',
      filters: [] as any[],
      groups: [] as any[]
    };

    filterGroups.forEach(group => {
      if (group.individualFilters && group.individualFilters.length > 0) {
        const validFilters = group.individualFilters.filter((f: any) => f.field && f.operator && f.value);
        if (validFilters.length > 0) {
          mainGroup.groups.push({
            operator: group.operator,
            filters: validFilters,
            groups: []
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
  }

  // Display helpers
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
    }   

  getDataColumns(): string[] {
  if (!this.queryResult || !this.queryResult.data || this.queryResult.data.length === 0) {
    return [];
  }
  // Dynamically get all property names from the first item
  return Object.keys(this.queryResult.data[0]);
}


  getNestedValue(row: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc && acc[part], row);
}
}