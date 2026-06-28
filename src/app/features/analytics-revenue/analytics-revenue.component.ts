import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ParamMap, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
} from 'chart.js';
import {
  EMPTY,
  Subject,
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  AnalyticsBreakdownDimension,
  AnalyticsDashboard,
  AnalyticsFilters,
  AnalyticsInterval,
  AnalyticsPaymentMethod,
  RecentTransaction,
  RecentTransactions,
  RevenueBreakdown,
  RevenueSummary,
  RevenueTrend,
} from '../../core/models/analytics-revenue.model';
import { AnalyticsRevenueService } from '../../core/services/api/analytics-revenue.service';
import { LocationService } from '../../core/services/api/locations.service';
import { SettingsManagerService } from '../../core/services/utility/settings-manager.service';
import { Location } from '../../core/models/api/responses/location.model';
import TranslationService from '../../core/services/utility/translation.service';

Chart.register(...registerables);

type ReloadScope = 'dashboard' | 'trend' | 'breakdown' | 'transactions';
type SectionRequest = AnalyticsFilters | null;

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilters = {
  allLocations: false,
  interval: 'auto',
  dimension: 'product',
  limit: 10,
  page: 0,
  pageSize: 20,
};

export function parseAnalyticsFilters(params: ParamMap): AnalyticsFilters {
  const interval = params.get('interval');
  const dimension = params.get('dimension');
  const paymentMethod = Number(params.get('paymentMethod'));
  const locationId = Number(params.get('locationId'));
  const limit = Number(params.get('limit'));
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));

  const allLocations = params.get('allLocations') === 'true';

  return {
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
    locationId:
      !allLocations && Number.isInteger(locationId) && locationId > 0
        ? locationId
        : undefined,
    allLocations,
    paymentMethod: [1, 2, 3].includes(paymentMethod)
      ? (paymentMethod as AnalyticsPaymentMethod)
      : undefined,
    interval: isInterval(interval) ? interval : DEFAULT_ANALYTICS_FILTERS.interval,
    dimension: isDimension(dimension)
      ? dimension
      : DEFAULT_ANALYTICS_FILTERS.dimension,
    limit: Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_ANALYTICS_FILTERS.limit,
    page: Number.isInteger(page) && page >= 0 ? page : DEFAULT_ANALYTICS_FILTERS.page,
    pageSize:
      Number.isInteger(pageSize) && pageSize > 0
        ? pageSize
        : DEFAULT_ANALYTICS_FILTERS.pageSize,
  };
}

export function analyticsFiltersToQueryParams(
  filters: AnalyticsFilters
): Record<string, string | number | boolean | undefined> {
  return {
    from: filters.from,
    to: filters.to,
    locationId: filters.allLocations ? undefined : filters.locationId,
    allLocations: filters.allLocations || undefined,
    paymentMethod: filters.paymentMethod,
    interval:
      filters.interval === DEFAULT_ANALYTICS_FILTERS.interval
        ? undefined
        : filters.interval,
    dimension:
      filters.dimension === DEFAULT_ANALYTICS_FILTERS.dimension
        ? undefined
        : filters.dimension,
    limit:
      filters.limit === DEFAULT_ANALYTICS_FILTERS.limit ? undefined : filters.limit,
    page: filters.page === 0 ? undefined : filters.page,
    pageSize:
      filters.pageSize === DEFAULT_ANALYTICS_FILTERS.pageSize
        ? undefined
        : filters.pageSize,
  };
}

export function determineReloadScope(
  previous: AnalyticsFilters,
  next: AnalyticsFilters
): ReloadScope[] {
  const baseChanged =
    previous.from !== next.from ||
    previous.to !== next.to ||
    previous.locationId !== next.locationId ||
    previous.allLocations !== next.allLocations ||
    previous.paymentMethod !== next.paymentMethod;

  if (baseChanged) {
    return ['dashboard'];
  }

  const scopes: ReloadScope[] = [];
  if (previous.interval !== next.interval) {
    scopes.push('trend');
  }
  if (
    previous.dimension !== next.dimension ||
    previous.limit !== next.limit
  ) {
    scopes.push('breakdown');
  }
  if (
    previous.page !== next.page ||
    previous.pageSize !== next.pageSize
  ) {
    scopes.push('transactions');
  }

  return scopes.length > 1 ? ['dashboard'] : scopes;
}

@Component({
  selector: 'ascend-analytics-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './analytics-revenue.component.html',
})
export class AnalyticsRevenueComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('trendCanvas') trendCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly analyticsService = inject(AnalyticsRevenueService);
  private readonly locationService = inject(LocationService);
  private readonly settingsManager = inject(SettingsManagerService);
  private readonly translationService = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly dashboardRequest$ = new Subject<AnalyticsFilters>();
  private readonly trendRequest$ = new Subject<SectionRequest>();
  private readonly breakdownRequest$ = new Subject<SectionRequest>();
  private readonly transactionsRequest$ = new Subject<SectionRequest>();

  private trendChart?: Chart;
  private viewReady = false;
  private initialized = false;
  private dashboardRequestId = 0;
  private trendRequestId = 0;
  private breakdownRequestId = 0;
  private transactionsRequestId = 0;

  readonly filters = signal<AnalyticsFilters>(DEFAULT_ANALYTICS_FILTERS);
  readonly locations = signal<Location[]>([]);
  readonly summary = signal<RevenueSummary | null>(null);
  readonly trend = signal<RevenueTrend | null>(null);
  readonly breakdown = signal<RevenueBreakdown | null>(null);
  readonly recentTransactions = signal<RecentTransactions | null>(null);

  readonly dashboardLoading = signal(false);
  readonly trendLoading = signal(false);
  readonly breakdownLoading = signal(false);
  readonly transactionsLoading = signal(false);
  readonly locationsLoading = signal(false);

  readonly dashboardError = signal<string | null>(null);
  readonly trendError = signal<string | null>(null);
  readonly breakdownError = signal<string | null>(null);
  readonly transactionsError = signal<string | null>(null);

  readonly currentLocationId = this.readCurrentLocationId();
  get currentLocationName(): string | null {
    if (!this.currentLocationId) {
      return null;
    }

    return (
      this.locations().find(
        (location) => location.id === this.currentLocationId
      )?.name ?? null
    );
  }
  readonly locationSelection = computed(() => {
    const filters = this.filters();
    if (filters.allLocations) {
      return 'all';
    }
    return filters.locationId ? `location:${filters.locationId}` : 'current';
  });
  readonly pageNumber = computed(
    () => (this.recentTransactions()?.page ?? this.filters().page) + 1
  );
  readonly availableBreakdownDimensions: AnalyticsBreakdownDimension[] = [
    'product',
    'category',
    'payment-method',
    'location',
    'staff',
  ];
  readonly dateRangeInvalid = computed(() => {
    const { from, to } = this.filters();
    return Boolean(from && to && from > to);
  });

  ngOnInit(): void {
    this.setupRequestStreams();
    this.loadLocations();

    this.route.queryParamMap
      .pipe(
        map((params) => parseAnalyticsFilters(params)),
        distinctUntilChanged(
          (left, right) => JSON.stringify(left) === JSON.stringify(right)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((filters) => this.handleRouteFilters(filters));
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderTrendChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.trendChart?.destroy();
  }

  updateBaseFilter(
    key: 'from' | 'to' | 'paymentMethod',
    value: string
  ): void {
    const patch: Partial<AnalyticsFilters> =
      key === 'paymentMethod'
        ? {
            paymentMethod: value
              ? (Number(value) as AnalyticsPaymentMethod)
              : undefined,
          }
        : { [key]: value || undefined };
    this.navigateWithFilters({ ...patch, page: 0 });
  }

  updateInterval(value: AnalyticsInterval): void {
    this.navigateWithFilters({ interval: value });
  }

  updateDimension(value: AnalyticsBreakdownDimension): void {
    this.navigateWithFilters({ dimension: value });
  }

  updateLocation(value: string): void {
    if (value === 'all') {
      this.navigateWithFilters({
        allLocations: true,
        locationId: undefined,
        page: 0,
      });
      return;
    }

    if (value.startsWith('location:')) {
      this.navigateWithFilters({
        allLocations: false,
        locationId: Number(value.split(':')[1]),
        page: 0,
      });
      return;
    }

    this.navigateWithFilters({
      allLocations: false,
      locationId: undefined,
      page: 0,
    });
  }

  updatePageSize(value: string): void {
    this.navigateWithFilters({ pageSize: Number(value), page: 0 });
  }

  previousPage(): void {
    const current = this.recentTransactions()?.page ?? this.filters().page;
    if (current > 0) {
      this.navigateWithFilters({ page: current - 1 });
    }
  }

  nextPage(): void {
    const transactions = this.recentTransactions();
    if (transactions && transactions.page + 1 < transactions.pages) {
      this.navigateWithFilters({ page: transactions.page + 1 });
    }
  }

  resetFilters(): void {
    this.navigateToFilters(DEFAULT_ANALYTICS_FILTERS);
  }

  retryDashboard(): void {
    this.requestDashboard(this.filters());
  }

  retryTrend(): void {
    this.trendRequest$.next(this.filters());
  }

  retryBreakdown(): void {
    this.breakdownRequest$.next(this.filters());
  }

  retryTransactions(): void {
    this.transactionsRequest$.next(this.filters());
  }

  formatMoney(value: number | null | undefined): string {
    return this.settingsManager.formatCurrency(value);
  }

  formatGrowth(value: number | null): string {
    if (value === null || value === undefined) {
      return this.translationService.getTranslationForKey('shared.not-available');
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  formatDateTime(transaction: RecentTransaction): string {
    const value = transaction.dateTime ?? transaction.timestamp ?? transaction.date;
    return value ? new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value)) : '—';
  }

  transactionNumber(transaction: RecentTransaction): string {
    return transaction.transactionNumber ?? transaction.number ?? '—';
  }

  transactionLocation(transaction: RecentTransaction): string {
    return transaction.locationName ?? transaction.location ?? '—';
  }

  transactionStaff(transaction: RecentTransaction): string {
    return transaction.staffUser ?? transaction.staffName ?? transaction.staffMember ?? '—';
  }

  transactionTax(transaction: RecentTransaction): number {
    return transaction.tax ?? transaction.taxAmount ?? 0;
  }

  transactionDiscount(transaction: RecentTransaction): number {
    return transaction.discount ?? transaction.discountAmount ?? 0;
  }

  paymentMethodLabel(method: AnalyticsPaymentMethod | string): string {
    switch (Number(method)) {
      case AnalyticsPaymentMethod.Cash:
        return this.translationService.getTranslationForKey('analytics.payment.cash');
      case AnalyticsPaymentMethod.Card:
        return this.translationService.getTranslationForKey('analytics.payment.card');
      case AnalyticsPaymentMethod.Other:
        return this.translationService.getTranslationForKey('analytics.payment.other');
      default:
        return String(method || '—');
    }
  }

  breakdownWidth(itemPercentage: number): string {
    return `${Math.min(Math.max(itemPercentage, 0), 100)}%`;
  }

  trackBreakdown(_: number, item: { key: string }): string {
    return item.key;
  }

  private handleRouteFilters(next: AnalyticsFilters): void {
    const previous = this.filters();
    this.filters.set(next);

    if (this.dateRangeInvalid()) {
      this.cancelSectionRequests();
      this.dashboardError.set(
        this.translationService.getTranslationForKey('analytics.errors.invalidDateRange')
      );
      this.initialized = true;
      return;
    }

    if (!this.initialized) {
      this.initialized = true;
      this.requestDashboard(next);
      return;
    }

    const scopes = determineReloadScope(previous, next);
    if (this.dashboardLoading() && scopes.length > 0) {
      this.requestDashboard(next);
      return;
    }

    if (scopes.includes('dashboard')) {
      this.requestDashboard(next);
      return;
    }

    for (const scope of scopes) {
      if (scope === 'trend') {
        this.trendRequest$.next(next);
      } else if (scope === 'breakdown') {
        this.breakdownRequest$.next(next);
      } else if (scope === 'transactions') {
        this.transactionsRequest$.next(next);
      }
    }
  }

  private requestDashboard(filters: AnalyticsFilters): void {
    this.cancelSectionRequests();
    this.dashboardRequest$.next(filters);
  }

  private cancelSectionRequests(): void {
    this.trendRequest$.next(null);
    this.breakdownRequest$.next(null);
    this.transactionsRequest$.next(null);
  }

  private setupRequestStreams(): void {
    this.dashboardRequest$
      .pipe(
        switchMap((filters) => {
          const requestId = ++this.dashboardRequestId;
          this.dashboardLoading.set(true);
          this.trendLoading.set(true);
          this.breakdownLoading.set(true);
          this.transactionsLoading.set(true);
          this.dashboardError.set(null);
          this.trendError.set(null);
          this.breakdownError.set(null);
          this.transactionsError.set(null);

          return this.analyticsService.getDashboard(filters).pipe(
            map((data) => ({ data, error: null as string | null })),
            catchError((error: unknown) =>
              of({ data: null, error: this.errorMessage(error) })
            ),
            finalize(() => {
              if (requestId === this.dashboardRequestId) {
                this.dashboardLoading.set(false);
                this.trendLoading.set(false);
                this.breakdownLoading.set(false);
                this.transactionsLoading.set(false);
              }
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ data, error }) => {
        if (error) {
          this.dashboardError.set(error);
          return;
        }
        if (data) {
          this.applyDashboard(data);
        }
      });

    this.trendRequest$
      .pipe(
        switchMap((filters) => {
          const requestId = ++this.trendRequestId;
          if (!filters) {
            this.trendLoading.set(false);
            return EMPTY;
          }
          this.trendLoading.set(true);
          this.trendError.set(null);
          return this.analyticsService.getTrend(filters).pipe(
            map((data) => ({ data, error: null as string | null })),
            catchError((error: unknown) =>
              of({ data: null, error: this.errorMessage(error) })
            ),
            finalize(() => {
              if (requestId === this.trendRequestId) {
                this.trendLoading.set(false);
              }
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ data, error }) => {
        this.trendError.set(error);
        if (data) {
          this.trend.set(data);
          this.renderTrendChart();
        }
      });

    this.breakdownRequest$
      .pipe(
        switchMap((filters) => {
          const requestId = ++this.breakdownRequestId;
          if (!filters) {
            this.breakdownLoading.set(false);
            return EMPTY;
          }
          this.breakdownLoading.set(true);
          this.breakdownError.set(null);
          return this.analyticsService.getBreakdown(filters).pipe(
            map((data) => ({ data, error: null as string | null })),
            catchError((error: unknown) =>
              of({ data: null, error: this.errorMessage(error) })
            ),
            finalize(() => {
              if (requestId === this.breakdownRequestId) {
                this.breakdownLoading.set(false);
              }
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ data, error }) => {
        this.breakdownError.set(error);
        if (data) {
          this.breakdown.set(data);
        }
      });

    this.transactionsRequest$
      .pipe(
        switchMap((filters) => {
          const requestId = ++this.transactionsRequestId;
          if (!filters) {
            this.transactionsLoading.set(false);
            return EMPTY;
          }
          this.transactionsLoading.set(true);
          this.transactionsError.set(null);
          return this.analyticsService.getRecentTransactions(filters).pipe(
            map((data) => ({ data, error: null as string | null })),
            catchError((error: unknown) =>
              of({ data: null, error: this.errorMessage(error) })
            ),
            finalize(() => {
              if (requestId === this.transactionsRequestId) {
                this.transactionsLoading.set(false);
              }
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ data, error }) => {
        this.transactionsError.set(error);
        if (data) {
          this.recentTransactions.set(data);
        }
      });
  }

  private applyDashboard(data: AnalyticsDashboard): void {
    this.summary.set(data.summary);
    this.trend.set(data.trend);
    this.breakdown.set(data.breakdown);
    this.recentTransactions.set(data.recentTransactions);
    this.renderTrendChart();
  }

  private loadLocations(): void {
    this.locationsLoading.set(true);
    this.locationService
      .getAll()
      .pipe(
        catchError(() => of({ data: [], count: 0, pages: 0 })),
        finalize(() => this.locationsLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => this.locations.set(page.data));
  }

  private navigateWithFilters(patch: Partial<AnalyticsFilters>): void {
    this.navigateToFilters({ ...this.filters(), ...patch });
  }

  private navigateToFilters(filters: AnalyticsFilters): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: analyticsFiltersToQueryParams(filters),
      replaceUrl: true,
    });
  }

  private renderTrendChart(): void {
    if (!this.viewReady || !this.trendCanvas || !this.trend()) {
      return;
    }

    const trend = this.trend()!;
    this.trendChart?.destroy();
    const moneyLabel = (value: number) => this.formatMoney(value);

    const configuration: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: trend.data.map((point) => point.label),
        datasets: [
          {
            type: 'line',
            label: this.translationService.getTranslationForKey('analytics.summary.periodGross'),
            data: trend.data.map((point) => point.grossRevenue),
            borderColor: '#6c63ff',
            backgroundColor: 'rgba(108, 99, 255, 0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            yAxisID: 'revenue',
          },
          {
            type: 'line',
            label: this.translationService.getTranslationForKey('analytics.summary.netRevenue'),
            data: trend.data.map((point) => point.netRevenue),
            borderColor: '#1f9d55',
            backgroundColor: 'rgba(31, 157, 85, 0.08)',
            fill: false,
            tension: 0.3,
            pointRadius: 3,
            yAxisID: 'revenue',
          },
          {
            type: 'bar',
            label: this.translationService.getTranslationForKey('analytics.table.transactions'),
            data: trend.data.map((point) => point.transactionCount),
            backgroundColor: 'rgba(36, 36, 58, 0.12)',
            borderColor: 'rgba(36, 36, 58, 0.35)',
            borderWidth: 1,
            yAxisID: 'transactions',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                context.dataset.yAxisID === 'revenue'
                  ? `${context.dataset.label}: ${moneyLabel(Number(context.raw))}`
                  : `${context.dataset.label}: ${context.raw}`,
            },
          },
        },
        scales: {
          revenue: {
            beginAtZero: true,
            position: 'left',
            ticks: {
              callback: (value) => moneyLabel(Number(value)),
            },
            grid: { color: '#eef0f5' },
          },
          transactions: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { precision: 0 },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    };

    this.trendChart = new Chart(this.trendCanvas.nativeElement, configuration);
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const candidate = error as {
        error?: { detail?: string; message?: string };
        message?: string;
      };
      return (
        candidate.error?.detail ??
        candidate.error?.message ??
        candidate.message ??
        this.translationService.getTranslationForKey('analytics.errors.dataLoad')
      );
    }
    return this.translationService.getTranslationForKey('analytics.errors.dataLoad');
  }

  private readCurrentLocationId(): number | null {
    const value = Number(localStorage.getItem('location'));
    return Number.isInteger(value) && value > 0 ? value : null;
  }
}

function isInterval(value: string | null): value is AnalyticsInterval {
  return value === 'auto' || value === 'day' || value === 'week' || value === 'month';
}

function isDimension(
  value: string | null
): value is AnalyticsBreakdownDimension {
  return (
    value === 'product' ||
    value === 'category' ||
    value === 'payment-method' ||
    value === 'location' ||
    value === 'staff'
  );
}
