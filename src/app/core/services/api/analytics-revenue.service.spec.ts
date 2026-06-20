import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  AnalyticsBreakdownDimension,
  AnalyticsFilters,
  AnalyticsPaymentMethod,
} from '../../models/analytics-revenue.model';
import { AnalyticsRevenueService } from './analytics-revenue.service';

describe('AnalyticsRevenueService', () => {
  let service: AnalyticsRevenueService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnalyticsRevenueService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AnalyticsRevenueService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the dashboard with supported filters and credentials', () => {
    const filters: AnalyticsFilters = {
      from: '2026-06-01',
      to: '2026-06-18',
      locationId: 7,
      allLocations: false,
      paymentMethod: AnalyticsPaymentMethod.Card,
      interval: 'week',
      dimension: 'category' as AnalyticsBreakdownDimension,
      limit: 5,
      page: 2,
      pageSize: 50,
    };

    service.getDashboard(filters).subscribe();

    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === `${environment.domain}/analytics/revenue/dashboard`
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.params.get('from')).toBe('2026-06-01');
    expect(request.request.params.get('to')).toBe('2026-06-18');
    expect(request.request.params.get('locationId')).toBe('7');
    expect(request.request.params.get('allLocations')).toBe('false');
    expect(request.request.params.get('paymentMethod')).toBe('2');
    expect(request.request.params.get('interval')).toBe('week');
    expect(request.request.params.get('dimension')).toBe('category');
    expect(request.request.params.get('limit')).toBe('5');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('50');

    request.flush({});
  });

  it('omits optional filters when the current location and all payment methods are used', () => {
    service
      .getRecentTransactions({
        allLocations: false,
        interval: 'auto',
        dimension: 'product',
        limit: 10,
        page: 0,
        pageSize: 20,
      })
      .subscribe();

    const request = httpTesting.expectOne(
      `${environment.domain}/analytics/revenue/recent-transactions?allLocations=false&interval=auto&dimension=product&limit=10&page=0&pageSize=20`
    );

    expect(request.request.params.has('locationId')).toBeFalse();
    expect(request.request.params.has('paymentMethod')).toBeFalse();
    request.flush({});
  });
});

