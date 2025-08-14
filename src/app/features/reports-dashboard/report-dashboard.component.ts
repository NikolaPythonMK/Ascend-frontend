import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ReportingService } from '../../core/services/api/reporting.service';
import { finalize, of, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { SnackbarService } from '../../core/services/utility/snackbar.service';
import { Report } from '../../core/models/api/responses/report.model';
import { Page } from '../../core/models/api/page.model';
import { Router } from '@angular/router';
import { Filter } from '../../core/models/api/value-objects/filter.model';
import { QueryResultService } from '../../core/services/utility/query-result.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  products: number;
  productsChange: number;
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
  styleUrls: ['./report-dashboard.component.scss'],
})
export class DynamicReportsComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: false })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly reportingService = inject(ReportingService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly routerService = inject(Router);
  private readonly queryResultService = inject(QueryResultService);
  // Subject for managing subscriptions
  private readonly destroy$ = new Subject<void>();

  // Timeout references for cleanup
  private chartInitTimeout?: ReturnType<typeof setTimeout>;
  private chartUpdateTimeout?: ReturnType<typeof setTimeout>;

  spanOfData = signal<string>('month');
  chart = signal<Chart | null>(null);
  reports = signal<Report[]>([]);
  reportsTitle = signal<string>('Reports - All');

  chartData = signal<ChartData>({
    labels: [],
    datasets: [
      {
        label: '',
        data: {},
        backgroundColor: ['#8b5cf6'],
        borderColor: ['#7c3aed'],
        borderWidth: 1,
      },
    ],
  });

  kpiData = signal<KPIData>({
    totalSales: 0,
    totalSalesChange: 0,
    transactions: 0,
    transactionsChange: 0,
    avgTransaction: 0,
    avgTransactionChange: 0,
    products: 0,
    productsChange: 0,
  });

  // Chart configuration
  selectedChartType: ChartType = 'bar';
  chartTypes = [
    { type: 'bar' as ChartType, label: 'Bar Chart', icon: '📊' },
    { type: 'line' as ChartType, label: 'Line Chart', icon: '📈' },
    { type: 'pie' as ChartType, label: 'Pie Chart', icon: '🥧' },
    { type: 'polarArea' as ChartType, label: 'Polar Chart', icon: '📊' },
  ];

  // Filter and query state
  filters: QueryFilter[] = [];
  currentQuery: DynamicQuery = {
    RootEntity: 'Transaction',
    Includes: ['TransactionItems'],
    Filters: {
      Operator: 'AND',
      Filters: [],
      Groups: [],
    },
    SelectFields: [],
    Aggregates: [],
    TotalAggregates: [],
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
        'canvas',
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
      const delay = 100 + currentAttempt * 50;
      this.chartInitTimeout = setTimeout(() => {
        this.initializeChartWithRetry(maxAttempts, currentAttempt + 1);
      }, delay);
    }
  }

  handleHover = (evt: any, item: any, legend: any) => {
    legend.chart.data.datasets[0].backgroundColor.forEach(
      (
        color: string | any[],
        index: string | number,
        colors: { [x: string]: any }
      ) => {
        colors[index] =
          index === item.index || color.length === 9 ? color : color + '4D';
      }
    );
    legend.chart.update();
  };

  handleLeave = (evt: any, item: any, legend: any) => {
    legend.chart.data.datasets[0].backgroundColor.forEach(
      (
        color: string | any[],
        index: string | number,
        colors: { [x: string]: any }
      ) => {
        colors[index] = color.length === 9 ? color.slice(0, -2) : color;
      }
    );
    legend.chart.update();
  };

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
              if (
                context.type === 'data' &&
                context.mode === 'default' &&
                !delayed
              ) {
                delay = context.dataIndex * 30 + context.datasetIndex * 30;
              }
              return delay;
            },
          },
          plugins: {
            legend: {
              display: true,
              onHover: this.handleHover,
              onLeave: this.handleLeave,
            },
          },
          scales:
            this.selectedChartType === 'pie' ||
            this.selectedChartType === 'doughnut'
              ? {}
              : {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#f3f4f6',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
        },
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
      this.allReports();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  loadKPIData(startDate?: Date, endDate?: Date) {
    try {
      const now = new Date();

      let rangeStart: Date;
      let rangeEnd: Date;
      let prevRangeStart: Date;
      let prevRangeEnd: Date;

      if (startDate && endDate) {
        rangeStart = startDate;
        rangeEnd = endDate;
        const rangeLengthMs = rangeEnd.getTime() - rangeStart.getTime();
        prevRangeEnd = new Date(rangeStart.getTime() - 1);
        prevRangeStart = new Date(prevRangeEnd.getTime() - rangeLengthMs);
        this.spanOfData.set('day');
      } else {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
        rangeEnd = now;
        prevRangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevRangeEnd = new Date(rangeStart.getTime() - 1);
        this.spanOfData.set('month');
      }

      const kpiQuery: DynamicQuery = {
        ...this.currentQuery,
        Filters: {
          Operator: 'AND',
          Filters: [
            {
              Field: 'Timestamp',
              Operator: '>=',
              Value: rangeStart.toISOString(),
            },
            {
              Field: 'Timestamp',
              Operator: '<=',
              Value: rangeEnd.toISOString(),
            },
          ],
          Groups: [],
        },
        Aggregates: [
          { Operation: 'Sum', Field: 'TotalGrossPrice', Alias: 'totalSales' },
          { Operation: 'Count', Field: 'Id', Alias: 'transactions' },
          {
            Operation: 'Avg',
            Field: 'TotalGrossPrice',
            Alias: 'avgTransaction',
          },
          {
            Operation: 'Count',
            Field: 'TransactionItems.Id',
            Alias: 'products',
          },
        ],
      };

      const kpiQueryPrev: DynamicQuery = {
        ...this.currentQuery,
        Filters: {
          Operator: 'AND',
          Filters: [
            {
              Field: 'Timestamp',
              Operator: '>=',
              Value: prevRangeStart.toISOString(),
            },
            {
              Field: 'Timestamp',
              Operator: '<=',
              Value: prevRangeEnd.toISOString(),
            },
          ],
          Groups: [],
        },
        Aggregates: [
          { Operation: 'Sum', Field: 'TotalGrossPrice', Alias: 'totalSales' },
          { Operation: 'Count', Field: 'Id', Alias: 'transactions' },
          {
            Operation: 'Avg',
            Field: 'TotalGrossPrice',
            Alias: 'avgTransaction',
          },
          {
            Operation: 'Count',
            Field: 'TransactionItems.Id',
            Alias: 'products',
          },
        ],
      };

      let currentData: any = null;

      this.reportingService
        .execute(kpiQuery)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            currentData = response.result.aggregates;
            this.kpiData.set({
              totalSales: currentData.totalSales || 0,
              transactions: currentData.transactions || 0,
              avgTransaction: currentData.avgTransaction || 0,
              products: currentData.products || 0,
              totalSalesChange: this.kpiData().totalSalesChange,
              transactionsChange: this.kpiData().transactionsChange,
              avgTransactionChange: this.kpiData().avgTransactionChange,
              productsChange: this.kpiData().productsChange,
            });

            this.reportingService
              .execute(kpiQueryPrev)
              .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.loading.set(false))
              )
              .subscribe({
                next: (prevResponse: any) => {
                  const prevData = prevResponse.result.aggregates;
                  this.kpiData.set({
                    totalSales: currentData.totalSales || 0,
                    transactions: currentData.transactions || 0,
                    avgTransaction: currentData.avgTransaction || 0,
                    products: currentData.products || 0,
                    totalSalesChange: this.calculateChange(
                      currentData.totalSales,
                      prevData.totalSales
                    ),
                    transactionsChange: this.calculateChange(
                      currentData.transactions,
                      prevData.transactions
                    ),
                    avgTransactionChange: this.calculateChange(
                      currentData.avgTransaction,
                      prevData.avgTransaction
                    ),
                    productsChange: this.calculateChange(
                      currentData.products,
                      prevData.products
                    ),
                  });
                },
                error: (err: HttpErrorResponse) => {
                  this.snackbarService.error(err.message);
                },
              });
          },
          error: (err: HttpErrorResponse) => {
            this.snackbarService.error(err.message);
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
      this.reportingService
        .chartdata()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (result: any) => {
            const response: ChartData = {
              labels: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ],
              datasets: [
                {
                  label: 'Value',
                  data: result,
                  backgroundColor: [
                    '#1b5cf6',
                    '#e91e63',
                    '#4caf50',
                    '#ff9800',
                    '#9c27b0',
                    '#03a9f4',
                    '#8bc34a',
                    '#ff5722',
                    '#00bcd4',
                    '#cddc39',
                    '#673ab7',
                    '#f44336',
                  ],
                  borderColor: [
                    '#1b5cf6',
                    '#e91e63',
                    '#4caf50',
                    '#ff9800',
                    '#9c27b0',
                    '#03a9f4',
                    '#8bc34a',
                    '#ff5722',
                    '#00bcd4',
                    '#cddc39',
                    '#673ab7',
                    '#f44336',
                  ],
                  borderWidth: 1,
                },
              ],
            };

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

  updateCurrentQuery() {
    this.currentQuery.Filters.Filters = this.filters;
  }

  async applyFilters() {
    this.updateCurrentQuery();
    await this.loadInitialData();
  }

  async exportPDF(filename: string = 'Dashboard-view.pdf'): Promise<void> {
    try {
      // Get the element to capture
      const element = document.documentElement; // Use documentElement instead of body

      // Store original styles
      const originalBodyStyles = {
        overflow: document.body.style.overflow,
        height: document.body.style.height,
        width: document.body.style.width,
        position: document.body.style.position,
      };

      const originalHtmlStyles = {
        overflow: document.documentElement.style.overflow,
        height: document.documentElement.style.height,
        width: document.documentElement.style.width,
      };

      // Force everything to be visible and rendered
      document.body.style.overflow = 'visible';
      document.body.style.height = 'auto';
      document.body.style.width = 'auto';
      document.body.style.position = 'static';

      document.documentElement.style.overflow = 'visible';
      document.documentElement.style.height = 'auto';
      document.documentElement.style.width = 'auto';

      // Get actual content dimensions
      const actualWidth = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );

      const actualHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      console.log(`Full content dimensions: ${actualWidth}x${actualHeight}px`);

      // Temporarily resize the window viewport simulation
      const originalViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Create canvas with full content rendered
      const canvas = await html2canvas(element, {
        width: actualWidth,
        height: actualHeight,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: false,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: actualWidth,
        windowHeight: actualHeight,
        // This is crucial - it forces rendering of the full content
        // Capture everything including hidden overflow
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return (
            element.tagName === 'SCRIPT' ||
            element.tagName === 'NOSCRIPT' ||
            element.classList?.contains('no-pdf')
          );
        },
      });

      // Restore original styles immediately after capture
      Object.assign(document.body.style, originalBodyStyles);
      Object.assign(document.documentElement.style, originalHtmlStyles);

      console.log(`Canvas created: ${canvas.width}x${canvas.height}px`);

      // Create PDF from canvas
      await this.createPDFFromCanvas(canvas, filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);

      // Ensure styles are restored even on error
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.body.style.position = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';

      throw error;
    }
  }

  // Alternative method: Scroll-based capture for very long pages
  async exportByScrollCapture(
    filename: string = 'scrolled-page.pdf'
  ): Promise<void> {
    try {
      const element = document.body;
      const viewportHeight = window.innerHeight;
      const fullHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      const captures: HTMLCanvasElement[] = [];
      const originalScrollY = window.scrollY;

      console.log(
        `Total height: ${fullHeight}px, Viewport: ${viewportHeight}px`
      );

      // Capture page in sections by scrolling
      for (let y = 0; y < fullHeight; y += viewportHeight) {
        window.scrollTo(0, y);

        // Wait for scroll and any lazy-loaded content
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await html2canvas(element, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          height: Math.min(viewportHeight, fullHeight - y),
          y: y,
          logging: false,
        });

        captures.push(canvas);
      }

      // Restore original scroll position
      window.scrollTo(0, originalScrollY);

      // Combine all captures into one canvas
      const combinedCanvas = await this.combineCanvases(captures);

      // Create PDF
      await this.createPDFFromCanvas(combinedCanvas, filename);
    } catch (error) {
      console.error('Error in scroll capture:', error);
      throw error;
    }
  }

  private async combineCanvases(
    canvases: HTMLCanvasElement[]
  ): Promise<HTMLCanvasElement> {
    if (canvases.length === 0) throw new Error('No canvases to combine');

    const totalHeight = canvases.reduce(
      (sum, canvas) => sum + canvas.height,
      0
    );
    const maxWidth = Math.max(...canvases.map((canvas) => canvas.width));

    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;

    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    let currentY = 0;
    for (const canvas of canvases) {
      ctx.drawImage(canvas, 0, currentY);
      currentY += canvas.height;
    }

    return combinedCanvas;
  }

  private async createPDFFromCanvas(
    canvas: HTMLCanvasElement,
    filename: string
  ): Promise<void> {
    const imgData = canvas.toDataURL('image/png', 0.95);

    // A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Calculate scaling to fit width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Determine orientation
    const orientation = imgHeight > imgWidth ? 'portrait' : 'landscape';

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
    });

    let remainingHeight = imgHeight;
    let yPosition = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
    remainingHeight -= pdfHeight;

    // Add additional pages if needed
    while (remainingHeight > 0) {
      yPosition -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, yPosition, imgWidth, imgHeight);
      remainingHeight -= pdfHeight;
    }

    // Download
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  }

  // Method that simulates zoom-out effect
  async exportWithZoomSimulation(
    filename: string = 'zoomed-page.pdf'
  ): Promise<void> {
    try {
      const body = document.body;
      const html = document.documentElement;

      // Get full content dimensions
      const fullWidth = Math.max(body.scrollWidth, html.scrollWidth);
      const fullHeight = Math.max(body.scrollHeight, html.scrollHeight);

      // Calculate zoom factor to fit everything in viewport
      const zoomFactorX = window.innerWidth / fullWidth;
      const zoomFactorY = window.innerHeight / fullHeight;
      const zoomFactor = Math.min(zoomFactorX, zoomFactorY, 1); // Don't zoom in, only out

      console.log(`Applying zoom factor: ${zoomFactor}`);

      // Store original styles
      const originalTransform = body.style.transform;
      const originalTransformOrigin = body.style.transformOrigin;
      const originalOverflow = html.style.overflow;

      // Apply zoom transformation
      body.style.transform = `scale(${zoomFactor})`;
      body.style.transformOrigin = 'top left';
      html.style.overflow = 'hidden';

      // Wait for transform to apply
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture with html2canvas
      const canvas = await html2canvas(body, {
        scale: 2, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: fullWidth,
        height: fullHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      // Restore original styles
      body.style.transform = originalTransform;
      body.style.transformOrigin = originalTransformOrigin;
      html.style.overflow = originalOverflow;

      await this.createPDFFromCanvas(canvas, filename);
    } catch (error) {
      console.error('Error with zoom simulation:', error);
      // Restore styles on error
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.documentElement.style.overflow = '';
      throw error;
    }
  }

  async exportExcel() {
   
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
      currency: 'USD',
    }).format(value);
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  getChangeClass(value: number): string {
    return value >= 0 ? 'positive' : 'negative';
  }

  private getReports(filters: Filter[]): void {
    this.reportingService.getAll([], undefined, filters).subscribe({
      next: (result: Page<Report>) => {
        this.reports.set(result.data);
      },
      error: (error: HttpErrorResponse) => {
        this.snackbarService.error(error.message);
      },
    });
  }

  displayReport(queryData: string, reportId: number) {
    const query = JSON.parse(queryData);

    this.reportingService
      .execute(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: any) => {
          if (result?.result) {
            this.snackbarService.success('Success');
            this.queryResultService.setQueryResult(
              query,
              result.result!,
              reportId
            );
            this.routerService.navigate(['report-view']);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Query execution failed:', error);
          this.snackbarService.error(
            'Query execution failed. Please check your parameters.'
          );
          return of(null);
        },
      });
  }
  navigateToCreateReport() {
    this.routerService.navigate(['dynamic-report']);
  }
  locationReports(): void {
    const locationId = Number(localStorage.getItem('location'));

    const filter: Filter = {
      propName: 'LocationID',
      operator: '=',
      value: locationId.toString(),
    };

    this.getReports([filter]);
    this.reportsTitle.set('Reports - Location');
  }
  organizationReports(): void {
    const filter: Filter = {
      propName: 'LocationID',
      operator: '=',
      value: null,
    };

    this.getReports([filter]);
    this.reportsTitle.set('Reports - Organization');
  }
  allReports(): void {
    this.getReports([]);
    this.reportsTitle.set('Reports - All');
  }
  getStartOfToday(): Date {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
  }

  getEndOfToday(): Date {
    const now = new Date();
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
  }
}
