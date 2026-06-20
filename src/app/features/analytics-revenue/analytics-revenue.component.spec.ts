import { convertToParamMap } from '@angular/router';
import {
  DEFAULT_ANALYTICS_FILTERS,
  analyticsFiltersToQueryParams,
  determineReloadScope,
  parseAnalyticsFilters,
} from './analytics-revenue.component';

describe('analytics revenue filter helpers', () => {
  it('parses valid URL filters and ignores unsupported values', () => {
    const filters = parseAnalyticsFilters(
      convertToParamMap({
        from: '2026-06-01',
        to: '2026-06-18',
        allLocations: 'true',
        locationId: '9',
        paymentMethod: '2',
        interval: 'week',
        dimension: 'staff',
        limit: '25',
        page: '3',
        pageSize: '50',
      })
    );

    expect(filters).toEqual({
      from: '2026-06-01',
      to: '2026-06-18',
      allLocations: true,
      locationId: undefined,
      paymentMethod: 2,
      interval: 'week',
      dimension: 'staff',
      limit: 25,
      page: 3,
      pageSize: 50,
    });
  });

  it('serializes only meaningful URL parameters', () => {
    expect(
      analyticsFiltersToQueryParams({
        ...DEFAULT_ANALYTICS_FILTERS,
        allLocations: true,
        locationId: 8,
        interval: 'month',
      })
    ).toEqual({
      from: undefined,
      to: undefined,
      locationId: undefined,
      allLocations: true,
      paymentMethod: undefined,
      interval: 'month',
      dimension: undefined,
      limit: undefined,
      page: undefined,
      pageSize: undefined,
    });
  });

  it('uses section endpoints for isolated controls and dashboard for cross-section filters', () => {
    expect(
      determineReloadScope(DEFAULT_ANALYTICS_FILTERS, {
        ...DEFAULT_ANALYTICS_FILTERS,
        interval: 'day',
      })
    ).toEqual(['trend']);

    expect(
      determineReloadScope(DEFAULT_ANALYTICS_FILTERS, {
        ...DEFAULT_ANALYTICS_FILTERS,
        dimension: 'location',
      })
    ).toEqual(['breakdown']);

    expect(
      determineReloadScope(DEFAULT_ANALYTICS_FILTERS, {
        ...DEFAULT_ANALYTICS_FILTERS,
        page: 1,
      })
    ).toEqual(['transactions']);

    expect(
      determineReloadScope(DEFAULT_ANALYTICS_FILTERS, {
        ...DEFAULT_ANALYTICS_FILTERS,
        paymentMethod: 1,
      })
    ).toEqual(['dashboard']);
  });
});
