import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ReportingService } from '../../core/services/api/reporting.service';
import { finalize, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { SnackbarService } from '../../core/services/utility/snackbar.service';

Chart.register(...registerables);

export interface QueryFilter {
  Field: string;
  Operator: string;
  Value: any;
}

export interface FilterGroup {
  Operator: 'AND' | 'OR';
  Filters: QueryFilter[];
  Groups: FilterGroup[];
}

export interface QueryAggregate {
  Operation: 'Sum' | 'Avg' | 'Count' | 'Min' | 'Max';
  Field: string;
  Alias: string;
}

export interface DynamicQuery {
  RootEntity: string;
  Includes: string[];
  Filters: FilterGroup;
  SelectFields: string[];
  Aggregates: QueryAggregate[];
  TotalAggregates: QueryAggregate[];
}

export interface KPIData {
  totalSales: number;
  totalSalesChange: number;
  transactions: number;
  transactionsChange: number;
  avgTransaction: number;
  avgTransactionChange: number;
  customers: number;
  customersChange: number;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-dashboard.component.html',
  styleUrls: ['./report-dashboard.component.scss']
})
export class DynamicReportsComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly reportingService = inject(ReportingService);
  private readonly snackbarService = inject(SnackbarService);
  
  // Subject for managing subscriptions
  private readonly destroy$ = new Subject<void>();
  
  // Timeout references for cleanup
  private chartInitTimeout?: ReturnType<typeof setTimeout>;
  private chartUpdateTimeout?: ReturnType<typeof setTimeout>;

  chart = signal<Chart | null>(null);

  chartData = signal<ChartData>({
    labels: [],
    datasets: [{
      label: '',
      data: {},
      backgroundColor: ['#8b5cf6'],
      borderColor: ['#7c3aed'],
      borderWidth: 1
    }]
  })

  kpiData = signal<KPIData>({
    totalSales: 0,
    totalSalesChange: 0,
    transactions: 0,
    transactionsChange: 0,
    avgTransaction: 0,
    avgTransactionChange: 0,
    customers: 0,
    customersChange: 0
  });

  // Chart configuration
  selectedChartType: ChartType = 'bar';
  chartTypes = [
    { type: 'bar' as ChartType, label: 'Bar Chart', icon: '📊' },
    { type: 'line' as ChartType, label: 'Line Chart', icon: '📈' },
    { type: 'pie' as ChartType, label: 'Pie Chart', icon: '🥧' },
    { type: 'polarArea' as ChartType, label: 'Polar Chart', icon: '📊' }
  ];

  // Filter and query state
  filters: QueryFilter[] = [];
  currentQuery: DynamicQuery = {
    RootEntity: "Transaction",
    Includes: ["TransactionItems"],
    Filters: {
      Operator: "AND",
      Filters: [],
      Groups: []
    },
    SelectFields: [],
    Aggregates: [],
    TotalAggregates: []
  };

  // Form fields
  xAxisField = 'Category';
  yAxisField = 'Amount';
  aggregationType = 'Sum';
  groupByField = 'No grouping';

  // Available fields for dropdowns
  availableFields = ['Category', 'Amount', 'Date', 'Customer', 'Product'];
  aggregationTypes = ['Sum', 'Count', 'Avg', 'Min', 'Max'];
  groupByOptions = ['No grouping', 'Category', 'Date', 'Customer'];

  // Loading state
  isLoading = false;
  loading = signal(false);

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.initializeChartWithRetry();
  }

  ngOnDestroy() {
    // Complete the destroy subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();

    // Clear any pending timeouts
    if (this.chartInitTimeout) {
      clearTimeout(this.chartInitTimeout);
    }
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
    }

    // Destroy chart instance
    if (this.chart()) {
      this.chart()!.destroy();
      this.chart.set(null);
    }
  }

  private initializeChartWithRetry(maxAttempts = 10, currentAttempt = 0) {
    let canvas: HTMLCanvasElement | null = null;

    if (this.chartCanvas && this.chartCanvas.nativeElement) {
      canvas = this.chartCanvas.nativeElement;
    } else {
      const selectors = [
        '#chartCanvas',
        'canvas#chartCanvas',
        '[data-chart="canvas"]',
        '.chart-container canvas',
        'canvas'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLCanvasElement;
        if (element) {
          canvas = element;
          this.chartCanvas = new ElementRef(canvas);
          break;
        }
      }
    }

    if (canvas) {
      this.createChart(canvas);
    } else if (currentAttempt < maxAttempts - 1) {
      const delay = 100 + (currentAttempt * 50);
      this.chartInitTimeout = setTimeout(() => {
        this.initializeChartWithRetry(maxAttempts, currentAttempt + 1);
      }, delay);
    }
  }

  handleHover = (evt: any, item: any, legend: any) => {
    legend.chart.data.datasets[0].backgroundColor.forEach((color: string | any[], index: string | number, colors: { [x: string]: any; }) => {
      colors[index] = index === item.index || color.length === 9 ? color : color + '4D';
    });
    legend.chart.update();
  }

  handleLeave = (evt: any, item: any, legend: any) => {
    legend.chart.data.datasets[0].backgroundColor.forEach((color: string | any[], index: string | number, colors: { [x: string]: any; }) => {
      colors[index] = color.length === 9 ? color.slice(0, -2) : color;
    });
    legend.chart.update();
  }

  private createChart(canvas: HTMLCanvasElement) {
    console.log('Creating chart on canvas:', canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Cannot get 2D context from canvas');
      return;
    }

    try {
      if (this.chart()) {
        this.chart()!.destroy();
        this.chart.set(null);
      }

      var delayed: boolean;

      const config: ChartConfiguration = {
        type: this.selectedChartType,
        data: this.chartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            onComplete: () => {
              delayed = true;
            },
            delay: (context) => {
              var delay = 0;
              if (context.type === 'data' && context.mode === 'default' && !delayed) {
                delay = context.dataIndex * 30 + context.datasetIndex * 30;
              }
              return delay;
            },
          },
          plugins: {
            legend: {
              display: true,
              onHover: this.handleHover,
              onLeave: this.handleLeave
            }
          },
          scales: this.selectedChartType === 'pie' || this.selectedChartType === 'doughnut' ? {} : {
            y: {
              beginAtZero: true,
              grid: {
                color: '#f3f4f6'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      };

      this.chart.set(new Chart(ctx, config));
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }

  async loadInitialData() {
    this.isLoading = true;
    try {
      await this.loadKPIData();
      await this.loadChartData();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadKPIData() {
    try {
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(startOfCurrentMonth.getTime() - 1);
      const startOfCurrentMonthISO = startOfCurrentMonth.toISOString();
      const startOfPreviousMonthISO = startOfPreviousMonth.toISOString();
      const endOfPreviousMonthISO = endOfPreviousMonth.toISOString();

      const kpiQuery: DynamicQuery = {
        ...this.currentQuery,
        Filters: {
          Operator: 'AND',
          Filters: [
            {
              Field: 'Timestamp',
              Operator: '>=',
              Value: startOfCurrentMonthISO
            }
          ],
          Groups: []
        },
        Aggregates: [
          { Operation: "Sum", Field: "TotalGrossPrice", Alias: "totalSales" },
          { Operation: "Count", Field: "Id", Alias: "transactions" },
          { Operation: "Avg", Field: "TotalGrossPrice", Alias: "avgTransaction" },
          { Operation: "Count", Field: "TransactionItems.Id", Alias: "customers" }
        ]
      };

      this.reportingService.execute(kpiQuery)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (response: any) => {
            console.log(response.result)
            this.kpiData.set({
              totalSales: response.result.aggregates.totalSales || this.kpiData().totalSales,
              totalSalesChange: response.result.aggregates.totalSalesChange || this.kpiData().totalSalesChange,
              transactions: response.result.aggregates.transactions || this.kpiData().transactions,
              transactionsChange: response.result.aggregates.transactionsChange || this.kpiData().transactionsChange,
              avgTransaction: response.result.aggregates.avgTransaction || this.kpiData().avgTransaction,
              avgTransactionChange: response.result.aggregates.avgTransactionChange || this.kpiData().avgTransactionChange,
              customers: response.result.aggregates.customers || this.kpiData().customers,
              customersChange: response.result.aggregates.customersChange || this.kpiData().customersChange
            });
          },
          error: (error: HttpErrorResponse) => {
            this.snackbarService.error(error.message);
          },
        });

      const kpiQueryOneWeekBefore: DynamicQuery = {
        ...this.currentQuery,
        Filters: {
          Operator: 'AND',
          Filters: [
            {
              Field: 'Timestamp',
              Operator: '>=',
              Value: startOfPreviousMonthISO
            },
            {
              Field: 'Timestamp',
              Operator: '<=',
              Value: endOfPreviousMonthISO
            }
          ],
          Groups: []
        },
        Aggregates: [
          { Operation: "Sum", Field: "TotalGrossPrice", Alias: "totalSales" },
          { Operation: "Count", Field: "Id", Alias: "transactions" },
          { Operation: "Avg", Field: "TotalGrossPrice", Alias: "avgTransaction" },
          { Operation: "Count", Field: "TransactionItems.Id", Alias: "customers" }
        ]
      };

      this.reportingService.execute(kpiQueryOneWeekBefore)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (response: any) => {
            console.log(response.result)
            this.kpiData.set({
              totalSalesChange: this.calculateChange(this.kpiData().totalSales, response.result.aggregates.totalSales),
              transactionsChange: this.calculateChange(this.kpiData().transactions, response.result.aggregates.transactions),
              avgTransactionChange: this.calculateChange(this.kpiData().avgTransaction, response.result.aggregates.avgTransaction),
              customersChange: this.calculateChange(this.kpiData().customers, response.result.aggregates.customers),
              totalSales: this.kpiData().totalSales,
              transactions: this.kpiData().transactions,
              avgTransaction: this.kpiData().avgTransaction,
              customers: this.kpiData().customers
            });
          },
          error: (error: HttpErrorResponse) => {
            this.snackbarService.error(error.message);
          },
        });
    } catch (error) {
      console.error('Error loading KPI data:', error);
    }
  }

  private calculateChange(current: number, previous: number) {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return ((current - previous) / previous) * 100;
  }

  async loadChartData() {
    try {
      this.reportingService.chartdata()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (result: any) => {
            const response: ChartData = {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [{
                label: 'Value',
                data: result,
                backgroundColor: ['#1b5cf6', '#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#03a9f4', '#8bc34a', '#ff5722', '#00bcd4', '#cddc39', '#673ab7', '#f44336'],
                borderColor: ['#1b5cf6', '#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#03a9f4', '#8bc34a', '#ff5722', '#00bcd4', '#cddc39', '#673ab7', '#f44336'],
                borderWidth: 1
              }]
            }

            if (response) {
              this.chartData.set(response);
              this.updateChart();
            }
          },
          error: (error: HttpErrorResponse) => {
            this.snackbarService.error(error.message);
          },
        });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  }

  initializeChart() {
    this.initializeChartWithRetry();
  }

  updateChart() {
    if (this.chart()) {
      this.chart()!.data = this.chartData();
      this.chart()!.update();
    }
  }

  onChartTypeChange(chartType: ChartType) {
    this.selectedChartType = chartType;

    if (this.chart()) {
      this.chart()!.destroy();
      this.chart.set(null);
    }

    // Clear any existing timeout before setting a new one
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
    }

    this.chartUpdateTimeout = setTimeout(() => {
      this.initializeChart();
    }, 100);
  }

  async onConfigurationChange() {
    await this.loadChartData();
  }

  // Filter methods
  addFilter() {
    const newFilter: QueryFilter = {
      Field: 'Id',
      Operator: '==',
      Value: ''
    };

    this.filters.push(newFilter);
    this.updateCurrentQuery();
  }

  removeFilter(index: number) {
    this.filters.splice(index, 1);
    this.updateCurrentQuery();
  }

  updateCurrentQuery() {
    this.currentQuery.Filters.Filters = this.filters;
  }

  async applyFilters() {
    this.updateCurrentQuery();
    await this.loadInitialData();
  }

  showSQL() {
    // Generate SQL representation of the query
    console.log('Current Query:', this.currentQuery);
    alert('SQL query logged to console');
  }

  // Export methods
  async exportPDF() {
    try {
      const exportQuery = { ...this.currentQuery, format: 'PDF' };
      console.log('Exporting PDF...', exportQuery);
      alert('PDF export functionality would be implemented here');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  }

  async exportExcel() {
    try {
      const exportQuery = { ...this.currentQuery, format: 'Excel' };
      console.log('Exporting Excel...', exportQuery);
      alert('Excel export functionality would be implemented here');
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  }

  async exportImage() {
    try {
      if (this.chart()) {
        const imageData = this.chart()!.toBase64Image();
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = imageData;
        link.click();
      }
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  }

  // Utility methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }
}