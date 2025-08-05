import { 
  FormArray, 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { 
  MatCardModule 
} from '@angular/material/card';
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
  TrackByFunction
} from '@angular/core';
import { 
  HttpClient, 
  HttpClientModule 
} from '@angular/common/http';
import { MatOption } from "@angular/material/core";
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { 
  debounceTime, 
  distinctUntilChanged, 
  takeUntil, 
  switchMap, 
  catchError,
  finalize 
} from 'rxjs/operators';
import { Subject, of, BehaviorSubject } from 'rxjs';

// Optimized interfaces
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

// Optimized grouped properties interface
interface PropertyGroup {
  label: string;
  properties: PropertyInfo[];
  expanded?: boolean;
}

@Component({
  selector: 'app-dynamic-query-builder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="query-builder-container">
      <!-- Header with quick actions -->
      <div class="header-section">
        <div class="title-section">
          <h1>
            <mat-icon>search</mat-icon>
            Query Builder
          </h1>
          <span class="subtitle">Build powerful queries with ease</span>
        </div>
        
        <div class="quick-actions">
          <button 
            mat-raised-button 
            color="primary" 
            (click)="executeQuery()"
            [disabled]="!queryForm.get('rootEntity')?.value || loading"
            matTooltip="Execute the current query">
            <mat-icon>play_arrow</mat-icon>
            {{ loading ? 'Running...' : 'Run Query' }}
          </button>
          
          <button 
            mat-stroked-button 
            (click)="previewQuery()"
            [disabled]="!queryForm.get('rootEntity')?.value"
            matTooltip="Preview query JSON">
            <mat-icon>visibility</mat-icon>
            Preview
          </button>
          
          <button 
            mat-stroked-button 
            color="warn"
            (click)="clearQuery()"
            matTooltip="Clear all settings">
            <mat-icon>clear_all</mat-icon>
            Clear
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <mat-progress-bar 
        *ngIf="loading" 
        mode="indeterminate" 
        class="progress-bar">
      </mat-progress-bar>

      <!-- Main form -->
      <form [formGroup]="queryForm" class="query-form">
        
        <!-- Entity Selection Card -->
        <mat-card class="config-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>dataset</mat-icon>
              Data Source
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Entity</mat-label>
              <mat-select 
                formControlName="rootEntity" 
                (selectionChange)="onEntityChange($event.value)"
                placeholder="Choose your data source">
                <mat-option *ngFor="let entity of entities; trackBy: trackByEntityName" 
                          [value]="entity.name">
                  {{ entity.displayName }}
                </mat-option>
              </mat-select>
              <mat-hint>Select the main entity to query</mat-hint>
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <!-- Configuration Panels -->
        <div class="config-panels" *ngIf="queryForm.get('rootEntity')?.value">
          
          <!-- Includes Panel -->
          <mat-expansion-panel 
            *ngIf="navigationProperties.length > 0"
            class="config-panel"
            [expanded]="false">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>link</mat-icon>
                Related Data
                <mat-chip-set class="chip-indicator">
                  <mat-chip>{{ getSelectedIncludes().length }}</mat-chip>
                </mat-chip-set>
              </mat-panel-title>
              <mat-panel-description>
                Include related entities in your query
              </mat-panel-description>
            </mat-expansion-panel-header>
            
            <div class="includes-grid">
              <mat-checkbox 
                *ngFor="let nav of navigationProperties; trackBy: trackByPropertyPath"
                [checked]="isIncludeSelected(nav.name)"
                (change)="toggleInclude(nav.name)"
                matTooltip="{{ nav.displayName }}">
                {{ nav.displayName }}
              </mat-checkbox>
            </div>
          </mat-expansion-panel>

          <!-- Filters Panel -->
          <mat-expansion-panel class="config-panel" [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>filter_list</mat-icon>
                Filters
                <mat-chip-set class="chip-indicator">
                  <mat-chip>{{ getTotalFiltersCount() }}</mat-chip>
                </mat-chip-set>
              </mat-panel-title>
              <mat-panel-description>
                Filter your data with conditions
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div formArrayName="filters">
              <div *ngFor="let filterGroup of filtersArray.controls; let i = index; trackBy: trackByIndex" 
                   [formGroupName]="i" 
                   class="filter-group">
                
                <div class="filter-group-header">
                  <mat-form-field appearance="outline" class="operator-field">
                    <mat-label>Logic</mat-label>
                    <mat-select formControlName="operator">
                      <mat-option value="AND">
                        <mat-icon>add</mat-icon>
                        AND (all conditions)
                      </mat-option>
                      <mat-option value="OR">
                        <mat-icon>settings_ethernet</mat-icon>
                        OR (any condition)
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="removeFilterGroup(i)"
                    *ngIf="filtersArray.length > 1"
                    matTooltip="Remove filter group">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <!-- Individual Filters -->
                <div formArrayName="individualFilters" class="individual-filters">
                  <div *ngFor="let filter of getIndividualFilters(i).controls; let j = index; trackBy: trackByIndex"
                       [formGroupName]="j" 
                       class="filter-row">
                    
                    <mat-form-field appearance="outline" class="field-select">
                      <mat-label>Field</mat-label>
                      <mat-select 
                        formControlName="field" 
                        (selectionChange)="onFieldChange(i, j, $event.value)">
                        <mat-optgroup *ngFor="let group of groupedProperties; trackBy: trackByGroupLabel" 
                                     [label]="group.label">
                          <mat-option *ngFor="let prop of group.properties; trackBy: trackByPropertyPath" 
                                     [value]="prop.path">
                            {{ prop.displayName }}
                          </mat-option>
                        </mat-optgroup>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="operator-select">
                      <mat-label>Condition</mat-label>
                      <mat-select formControlName="operator">
                        <mat-option *ngFor="let op of getAvailableOperators(i, j); trackBy: trackByOperatorValue" 
                                   [value]="op.value">
                          <mat-icon *ngIf="op.icon">{{ op.icon }}</mat-icon>
                          {{ op.label }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="value-input">
                      <mat-label>Value</mat-label>
                      <input 
                        matInput 
                        formControlName="value" 
                        [type]="getInputType(i, j)"
                        [placeholder]="getPlaceholder(i, j)">
                    </mat-form-field>

                    <button 
                      mat-icon-button 
                      color="warn" 
                      (click)="removeFilter(i, j)"
                      matTooltip="Remove filter">
                      <mat-icon>remove_circle</mat-icon>
                    </button>
                  </div>
                </div>

                <button 
                  mat-stroked-button 
                  color="primary" 
                  (click)="addFilter(i)"
                  class="add-filter-btn">
                  <mat-icon>add</mat-icon>
                  Add Filter
                </button>
              </div>
            </div>
            
            <button 
              mat-stroked-button 
              color="accent" 
              (click)="addFilterGroup()"
              class="add-group-btn">
              <mat-icon>add_box</mat-icon>
              Add Filter Group
            </button>
          </mat-expansion-panel>

          <!-- Select Fields Panel -->
          <mat-expansion-panel class="config-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>view_column</mat-icon>
                Select Fields
                <mat-chip-set class="chip-indicator">
                  <mat-chip>{{ getSelectedFields().length }}</mat-chip>
                </mat-chip-set>
              </mat-panel-title>
              <mat-panel-description>
                Choose which fields to include in results
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="fields-section">
              <div class="field-actions">
                <button mat-stroked-button (click)="selectAllFields()">
                  <mat-icon>select_all</mat-icon>
                  All
                </button>
                <button mat-stroked-button (click)="clearSelectedFields()">
                  <mat-icon>clear</mat-icon>
                  None
                </button>
              </div>

              <div *ngFor="let group of groupedProperties; trackBy: trackByGroupLabel" 
                   class="field-group">
                <h4 class="group-title">{{ group.label }}</h4>
                <div class="fields-grid">
                  <mat-checkbox 
                    *ngFor="let prop of group.properties; trackBy: trackByPropertyPath"
                    [checked]="isFieldSelected(prop.path)"
                    (change)="toggleField(prop.path)"
                    matTooltip="{{ prop.type }}">
                    {{ prop.displayName }}
                  </mat-checkbox>
                </div>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- Aggregates Panel -->
          <mat-expansion-panel class="config-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>functions</mat-icon>
                Calculations
                <mat-chip-set class="chip-indicator">
                  <mat-chip>{{ aggregatesArray.length + totalAggregatesArray.length }}</mat-chip>
                </mat-chip-set>
              </mat-panel-title>
              <mat-panel-description>
                Add calculations and summaries
              </mat-panel-description>
            </mat-expansion-panel-header>

            <!-- Filtered Aggregates -->
            <div class="aggregates-section">
              <h4>Filtered Data Calculations</h4>
              <div formArrayName="aggregates">
                <div *ngFor="let agg of aggregatesArray.controls; let i = index; trackBy: trackByIndex" 
                     [formGroupName]="i" 
                     class="aggregate-row">
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Operation</mat-label>
                    <mat-select 
                      formControlName="operation" 
                      (selectionChange)="onAggregateOperationChange(i, $event.value)">
                      <mat-option *ngFor="let op of aggregateOperations; trackBy: trackByAggregateValue" 
                                 [value]="op.value">
                        <mat-icon *ngIf="op.icon">{{ op.icon }}</mat-icon>
                        {{ op.label }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" *ngIf="requiresField(i)">
                    <mat-label>Field</mat-label>
                    <mat-select formControlName="field">
                      <mat-optgroup *ngFor="let group of getNumericProperties(); trackBy: trackByGroupLabel" 
                                   [label]="group.label">
                        <mat-option *ngFor="let prop of group.properties; trackBy: trackByPropertyPath" 
                                   [value]="prop.path">
                          {{ prop.displayName }}
                        </mat-option>
                      </mat-optgroup>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="alias" placeholder="Result name">
                  </mat-form-field>

                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="removeAggregate(i)"
                    matTooltip="Remove calculation">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              </div>
              
              <button 
                mat-stroked-button 
                color="primary" 
                (click)="addAggregate()">
                <mat-icon>add</mat-icon>
                Add Calculation
              </button>
            </div>

            <!-- Total Aggregates -->
            <div class="aggregates-section">
              <h4>Total Data Calculations</h4>
              <div formArrayName="totalAggregates">
                <div *ngFor="let agg of totalAggregatesArray.controls; let i = index; trackBy: trackByIndex" 
                     [formGroupName]="i" 
                     class="aggregate-row">
                  
                  <mat-form-field appearance="outline">
                    <mat-label>Operation</mat-label>
                    <mat-select formControlName="operation">
                      <mat-option *ngFor="let op of aggregateOperations; trackBy: trackByAggregateValue" 
                                 [value]="op.value">
                        <mat-icon *ngIf="op.icon">{{ op.icon }}</mat-icon>
                        {{ op.label }}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Field</mat-label>
                    <mat-select formControlName="field">
                      <mat-optgroup *ngFor="let group of getNumericProperties(); trackBy: trackByGroupLabel" 
                                   [label]="group.label">
                        <mat-option *ngFor="let prop of group.properties; trackBy: trackByPropertyPath" 
                                   [value]="prop.path">
                          {{ prop.displayName }}
                        </mat-option>
                      </mat-optgroup>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="alias" placeholder="Result name">
                  </mat-form-field>

                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="removeTotalAggregate(i)"
                    matTooltip="Remove calculation">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              </div>
              
              <button 
                mat-stroked-button 
                color="primary" 
                (click)="addTotalAggregate()">
                <mat-icon>add</mat-icon>
                Add Total Calculation
              </button>
            </div>
          </mat-expansion-panel>

          <!-- Sorting Panel -->
          <mat-expansion-panel class="config-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>sort</mat-icon>
                Sorting
                <mat-chip-set class="chip-indicator">
                  <mat-chip>{{ orderByArray.length }}</mat-chip>
                </mat-chip-set>
              </mat-panel-title>
              <mat-panel-description>
                Define how to sort your results
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div formArrayName="orderBy">
              <div *ngFor="let order of orderByArray.controls; let i = index; trackBy: trackByIndex" 
                   [formGroupName]="i" 
                   class="order-row">
                
                <mat-form-field appearance="outline">
                  <mat-label>Field</mat-label>
                  <mat-select formControlName="field">
                    <mat-optgroup *ngFor="let group of groupedProperties; trackBy: trackByGroupLabel" 
                                 [label]="group.label">
                      <mat-option *ngFor="let prop of group.properties; trackBy: trackByPropertyPath" 
                                 [value]="prop.path">
                        {{ prop.displayName }}
                      </mat-option>
                    </mat-optgroup>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Direction</mat-label>
                  <mat-select formControlName="direction">
                    <mat-option value="ASC">
                      <mat-icon>arrow_upward</mat-icon>
                      Ascending
                    </mat-option>
                    <mat-option value="DESC">
                      <mat-icon>arrow_downward</mat-icon>
                      Descending
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <button 
                  mat-icon-button 
                  color="warn" 
                  (click)="removeOrderBy(i)"
                  matTooltip="Remove sort">
                  <mat-icon>remove_circle</mat-icon>
                </button>
              </div>
            </div>
            
            <button 
              mat-stroked-button 
              color="primary" 
              (click)="addOrderBy()">
              <mat-icon>add</mat-icon>
              Add Sort
            </button>
          </mat-expansion-panel>

          <!-- Pagination Panel -->
          <mat-expansion-panel class="config-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>pages</mat-icon>
                Pagination
              </mat-panel-title>
              <mat-panel-description>
                Limit the number of results
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="pagination-controls">
              <mat-form-field appearance="outline">
                <mat-label>Skip Records</mat-label>
                <input matInput type="number" formControlName="skip" min="0" placeholder="0">
                <mat-hint>Number of records to skip</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Take Records</mat-label>
                <input matInput type="number" formControlName="take" min="1" placeholder="100">
                <mat-hint>Maximum records to return</mat-hint>
              </mat-form-field>
            </div>
          </mat-expansion-panel>
        </div>
      </form>

      <!-- Results Section -->
      <div *ngIf="queryResult" class="results-section">
        
        <!-- Summary Cards -->
        <div class="summary-section">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon>dataset</mat-icon>
                <div class="summary-details">
                  <div class="summary-value">{{ queryResult.count || 0 | number }}</div>
                  <div class="summary-label">Records Found</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card" *ngIf="getAggregateCount() > 0">
            <mat-card-content>
              <div class="summary-item">
                <mat-icon>functions</mat-icon>
                <div class="summary-details">
                  <div class="summary-value">{{ getAggregateCount() }}</div>
                  <div class="summary-label">Calculations</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Aggregates Display -->
        <div *ngIf="queryResult.aggregates || queryResult.totalAggregates" class="aggregates-results">
          
          <div *ngIf="queryResult.aggregates" class="aggregate-group">
            <h3>Filtered Results</h3>
            <div class="aggregates-grid">
              <mat-card *ngFor="let key of objectKeys(queryResult.aggregates); trackBy: trackByString" 
                       class="aggregate-card">
                <mat-card-content>
                  <div class="aggregate-label">{{ key }}</div>
                  <div class="aggregate-value">{{ queryResult.aggregates[key] | number:'1.2-2' }}</div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <div *ngIf="queryResult.totalAggregates" class="aggregate-group">
            <h3>Total Results</h3>
            <div class="aggregates-grid">
              <mat-card *ngFor="let key of objectKeys(queryResult.totalAggregates); trackBy: trackByString" 
                       class="aggregate-card total">
                <mat-card-content>
                  <div class="aggregate-label">{{ key }}</div>
                  <div class="aggregate-value">{{ queryResult.totalAggregates[key] | number:'1.2-2' }}</div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <mat-card *ngIf="queryResult.data && queryResult.data.length > 0" class="data-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>table_chart</mat-icon>
              Query Results
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="paginatedData" class="results-table">
                <ng-container *ngFor="let column of getDataColumns(); trackBy: trackByString" 
                             [matColumnDef]="column">
                  <th mat-header-cell *matHeaderCellDef class="table-header">
                    {{ column }}
                  </th>
                  <td mat-cell *matCellDef="let row" class="table-cell">
                    {{ formatCellValue(getNestedValue(row, column)) }}
                  </td>
                </ng-container>
                
                <tr mat-header-row *matHeaderRowDef="getDataColumns(); sticky: true"></tr>
                <tr mat-row *matRowDef="let row; columns: getDataColumns(); trackBy: trackByIndex"></tr>
              </table>
            </div>

            <mat-paginator 
              [length]="queryResult.data.length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- JSON Preview Modal -->
      <div *ngIf="showJsonPreview" class="modal-overlay" (click)="showJsonPreview = false">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Query Preview</h3>
            <button mat-icon-button (click)="showJsonPreview = false" matTooltip="Close">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="modal-content">
            <pre class="json-preview">{{ jsonPreview }}</pre>
          </div>
          <div class="modal-actions">
            <button mat-raised-button (click)="copyToClipboard()" color="primary">
              <mat-icon>content_copy</mat-icon>
              Copy
            </button>
            <button mat-stroked-button (click)="showJsonPreview = false">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .query-builder-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #fafafa;
      height: 100%;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .title-section h1 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      font-weight: 500;
    }

    .subtitle {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
      display: block;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .progress-bar {
      margin-bottom: 16px;
    }

    .config-card {
      margin-bottom: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .config-card mat-card-header {
      padding-bottom: 16px;
    }

    .config-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      font-size: 18px;
    }

    .config-panels {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .config-panel {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .config-panel mat-expansion-panel-header {
      height: 64px;
    }

    .config-panel .mat-expansion-panel-header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }

    .chip-indicator {
      margin-left: auto;
    }

    .chip-indicator mat-chip {
      background: #e3f2fd;
      color: #1976d2;
      font-weight: 500;
    }

    .full-width {
      width: 100%;
    }

    .includes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .filter-group {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border-left: 4px solid #1976d2;
    }

    .filter-group-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .operator-field {
      width: 200px;
    }

    .individual-filters {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .filter-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1.5fr auto;
      gap: 12px;
      align-items: center;
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .field-select, .operator-select, .value-input {
      min-width: 0;
    }

    .add-filter-btn, .add-group-btn {
      margin-top: 16px;
    }

    .fields-section {
      margin-top: 16px;
    }

    .field-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .field-group {
      margin-bottom: 24px;
    }

    .group-title {
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
      margin: 16px 0 8px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
      margin-left: 16px;
    }

    .aggregates-section {
      margin: 24px 0;
    }

    .aggregates-section h4 {
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .aggregate-row, .order-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 12px;
      align-items: center;
      margin: 12px 0;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .pagination-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 16px;
    }

    .results-section {
      margin-top: 32px;
    }

    .summary-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .summary-item mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .summary-details {
      flex: 1;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 600;
      color: #1976d2;
      line-height: 1;
    }

    .summary-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .aggregates-results {
      margin-bottom: 24px;
    }

    .aggregate-group {
      margin-bottom: 24px;
    }

    .aggregate-group h3 {
      color: #1976d2;
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .aggregates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .aggregate-card {
      text-align: center;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .aggregate-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .aggregate-card.total {
      border-left: 4px solid #ff9800;
    }

    .aggregate-card:not(.total) {
      border-left: 4px solid #1976d2;
    }

    .aggregate-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .aggregate-value {
      font-size: 24px;
      font-weight: 600;
      color: #1976d2;
    }

    .aggregate-card.total .aggregate-value {
      color: #ff9800;
    }

    .data-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .data-card mat-card-header {
      background: #f8f9fa;
      margin: -24px -24px 24px -24px;
      padding: 20px 24px;
      border-radius: 12px 12px 0 0;
    }

    .data-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1976d2;
      margin: 0;
    }

    .table-container {
      max-height: 600px;
      overflow: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .results-table {
      width: 100%;
      background: white;
    }

    .table-header {
      background: #f5f5f5;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #1976d2;
      padding: 16px 12px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .table-cell {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .results-table tr:hover {
      background: #f8f9fa;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .modal-header h3 {
      margin: 0;
      color: #1976d2;
      font-weight: 500;
    }

    .modal-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }

    .json-preview {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 500px;
      overflow: auto;
      margin: 0;
    }

    .modal-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: #f8f9fa;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .query-builder-container {
        padding: 12px;
      }

      .header-section {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .filter-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .aggregate-row, .order-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .pagination-controls {
        grid-template-columns: 1fr;
      }

      .summary-section {
        grid-template-columns: 1fr;
      }

      .aggregates-grid {
        grid-template-columns: 1fr;
      }

      .fields-grid {
        grid-template-columns: 1fr;
      }

      .includes-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Loading States */
    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }

    /* Animation */
    .config-panel, .summary-card, .aggregate-card {
      animation: fadeInUp 0.3s ease-out;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Improved form field appearance */
    .mat-mdc-form-field {
      margin-bottom: 8px;
    }

    .mat-mdc-form-field-appearance-outline .mat-mdc-form-field-outline {
      border-radius: 8px;
    }

    /* Better button styling */
    .mat-mdc-raised-button, .mat-mdc-stroked-button {
      border-radius: 8px;
      font-weight: 500;
    }

    /* Enhanced expansion panel */
    .mat-expansion-panel {
      border-radius: 12px !important;
      margin-bottom: 8px;
    }

    .mat-expansion-panel:not(.mat-expanded) {
      border-radius: 12px !important;
    }
  `],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
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
    MatPaginatorModule
  ]
})
export class DynamicQueryBuilderComponent implements OnInit, OnDestroy {
  queryForm: FormGroup;
  entities: EntityInfo[] = [];
  allProperties: PropertyInfo[] = [];
  navigationProperties: PropertyInfo[] = [];
  groupedProperties: PropertyGroup[] = [];
  queryResult: QueryResult | null = null;
  loading = false;
  showJsonPreview = false;
  jsonPreview = '';
  
  // Pagination
  pageSize = 25;
  currentPage = 0;
  paginatedData: any[] = [];
  
  // Performance optimization
  private destroy$ = new Subject<void>();
  private propertiesCache = new Map<string, PropertyInfo[]>();
  
  // Improved operators with icons
  filterOperators: FilterOperator[] = [
    { value: '==', label: 'Equals', supportedTypes: ['string', 'number', 'boolean', 'date'], icon: 'drag_handle' },
    { value: '!=', label: 'Not Equals', supportedTypes: ['string', 'number', 'boolean', 'date'], icon: 'not_equal' },
    { value: '>', label: 'Greater Than', supportedTypes: ['number', 'date'], icon: 'keyboard_arrow_right' },
    { value: '>=', label: 'Greater Than or Equal', supportedTypes: ['number', 'date'], icon: 'keyboard_double_arrow_right' },
    { value: '<', label: 'Less Than', supportedTypes: ['number', 'date'], icon: 'keyboard_arrow_left' },
    { value: '<=', label: 'Less Than or Equal', supportedTypes: ['number', 'date'], icon: 'keyboard_double_arrow_left' },
    { value: 'Contains', label: 'Contains', supportedTypes: ['string'], icon: 'search' },
    { value: 'StartsWith', label: 'Starts With', supportedTypes: ['string'], icon: 'west' },
    { value: 'EndsWith', label: 'Ends With', supportedTypes: ['string'], icon: 'east' },
    { value: 'In', label: 'In List', supportedTypes: ['string', 'number'], icon: 'list' }
  ];

  aggregateOperations: AggregateOperation[] = [
    { value: 'Sum', label: 'Sum', requiresField: true, icon: 'add' },
    { value: 'Average', label: 'Average', requiresField: true, icon: 'trending_flat' },
    { value: 'Count', label: 'Count', requiresField: false, icon: 'numbers' },
    { value: 'Min', label: 'Minimum', requiresField: true, icon: 'keyboard_arrow_down' },
    { value: 'Max', label: 'Maximum', requiresField: true, icon: 'keyboard_arrow_up' }
  ];

  private domain = environment.domain;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.queryForm = this.createForm();
  }

  ngOnInit() {
    this.loadEntities();
    this.setupFormSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // TrackBy functions for performance
  trackByEntityName: TrackByFunction<EntityInfo> = (index, item) => item.name;
  trackByPropertyPath: TrackByFunction<PropertyInfo> = (index, item) => item.path;
  trackByGroupLabel: TrackByFunction<PropertyGroup> = (index, item) => item.label;
  trackByIndex: TrackByFunction<any> = (index) => index;
  trackByString: TrackByFunction<string> = (index, item) => item;
  trackByOperatorValue: TrackByFunction<FilterOperator> = (index, item) => item.value;
  trackByAggregateValue: TrackByFunction<AggregateOperation> = (index, item) => item.value;

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
      take: [100, [Validators.min(1), Validators.max(10000)]]
    });
  }

  setupFormSubscriptions() {
    // Auto-save form state or debounce expensive operations
    this.queryForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Could implement auto-save here
        this.cdr.markForCheck();
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

  // API calls with error handling
  loadEntities() {
    this.http.get<EntityInfo[]>(`${this.domain}/entities`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.showError('Failed to load entities');
          return of([]);
        })
      )
      .subscribe(entities => {
        this.entities = entities;
        this.cdr.markForCheck();
      });
  }

  onEntityChange(entityName: string) {
    if (this.propertiesCache.has(entityName)) {
      this.setProperties(this.propertiesCache.get(entityName)!);
      return;
    }

    this.http.get<PropertyInfo[]>(`${this.domain}/entities/${entityName}/properties`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.showError('Failed to load entity properties');
          return of([]);
        })
      )
      .subscribe(properties => {
        this.propertiesCache.set(entityName, properties);
        this.setProperties(properties);
      });
  }

  private setProperties(properties: PropertyInfo[]) {
    this.allProperties = properties;
    this.navigationProperties = properties.filter(p => p.isNavigation);
    this.groupProperties();
    this.resetForm();
    this.cdr.markForCheck();
  }

  private resetForm() {
    // Clear dependent form controls when entity changes
    this.queryForm.patchValue({
      includes: [],
      selectFields: []
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
      properties: properties.sort((a, b) => a.displayName.localeCompare(b.displayName)),
      expanded: label === 'Root Properties'
    }));
  }

  getNumericProperties(): PropertyGroup[] {
    return this.groupedProperties.map(group => ({
      ...group,
      properties: group.properties.filter(p => 
        ['int', 'decimal', 'double', 'float', 'long'].includes(p.type.toLowerCase())
      )
    })).filter(group => group.properties.length > 0);
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
      return total + this.getIndividualFilters(this.filtersArray.controls.indexOf(group)).length;
    }, 0);
  }

  getAggregateCount(): number {
    const aggregates = this.queryResult?.aggregates ? Object.keys(this.queryResult.aggregates).length : 0;
    const totalAggregates = this.queryResult?.totalAggregates ? Object.keys(this.queryResult.totalAggregates).length : 0;
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
      ? current.filter(i => i !== includeName)
      : [...current, includeName];
    this.queryForm.patchValue({ includes: updated });
  }

  toggleField(fieldPath: string) {
    const current = this.getSelectedFields();
    const updated = current.includes(fieldPath)
      ? current.filter(f => f !== fieldPath)
      : [...current, fieldPath];
    this.queryForm.patchValue({ selectFields: updated });
  }

  selectAllFields() {
    const allPaths = this.allProperties.map(p => p.path);
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
    const property = this.allProperties.find(p => p.path === fieldPath);
    if (property) {
      const operators = this.getAvailableOperators(groupIndex, filterIndex);
      if (operators.length > 0) {
        this.getIndividualFilters(groupIndex).at(filterIndex).patchValue({
          operator: operators[0].value,
          value: '' // Clear value when field changes
        });
      }
    }
  }

  onAggregateOperationChange(index: number, operation: string) {
    const aggregateOp = this.aggregateOperations.find(op => op.value === operation);
    const fieldControl = this.aggregatesArray.at(index).get('field');
    
    if (aggregateOp?.requiresField) {
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
      default: return 'text';
    }
  }

  getPlaceholder(groupIndex: number, filterIndex: number): string {
    const operator = this.getIndividualFilters(groupIndex).at(filterIndex).get('operator')?.value;
    const fieldPath = this.getIndividualFilters(groupIndex).at(filterIndex).get('field')?.value;
    const property = this.allProperties.find(p => p.path === fieldPath);
    
    if (operator === 'In') return 'Enter comma-separated values';
    if (property) {
      const genericType = this.mapToGenericType(property.type);
      switch (genericType) {
        case 'number': return 'Enter number';
        case 'date': return 'Select date';
        case 'boolean': return 'true/false';
        default: return 'Enter text';
      }
    }
    return 'Enter value';
  }

  requiresField(index: number): boolean {
    const operation = this.aggregatesArray.at(index).get('operation')?.value;
    return this.aggregateOperations.find(op => op.value === operation)?.requiresField || false;
  }

  // Query execution with better error handling
  executeQuery() {
    this.loading = true;
    const queryData = this.buildQueryObject();

    this.http.post<any>(`${this.domain}/reporting/execute`, queryData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        catchError(error => {
          console.error('Query execution failed:', error);
          this.showError('Query execution failed. Please check your parameters.');
          return of(null);
        })
      )
      .subscribe(result => {
        if (result?.result) {
          this.queryResult = result.result;
          this.updatePaginatedData();
          this.showSuccess(`Query executed successfully. Found ${this.queryResult?.count || 0} records.`);
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
      skip: formValue.skip || 0,
      take: formValue.take || 100
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

  // Utility methods
  copyToClipboard() {
    navigator.clipboard.writeText(this.jsonPreview).then(() => {
      this.showSuccess('Query JSON copied to clipboard!');
    }).catch(() => {
      this.showError('Failed to copy to clipboard');
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  // Performance optimization methods
  private debounceExecution = this.debounce((callback: () => void) => callback(), 300);

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
}