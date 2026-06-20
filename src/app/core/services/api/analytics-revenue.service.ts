import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AnalyticsDashboard,
  AnalyticsFilters,
  RecentTransactions,
  RevenueBreakdown,
  RevenueSummary,
  RevenueTrend,
} from '../../models/analytics-revenue.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsRevenueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.domain}/analytics/revenue`;

  getDashboard(filters: AnalyticsFilters): Observable<AnalyticsDashboard> {
    return this.get<AnalyticsDashboard>('dashboard', filters);
  }

  getSummary(filters: AnalyticsFilters): Observable<RevenueSummary> {
    return this.get<RevenueSummary>('summary', filters);
  }

  getTrend(filters: AnalyticsFilters): Observable<RevenueTrend> {
    return this.get<RevenueTrend>('trend', filters);
  }

  getBreakdown(filters: AnalyticsFilters): Observable<RevenueBreakdown> {
    return this.get<RevenueBreakdown>('breakdown', filters);
  }

  getRecentTransactions(filters: AnalyticsFilters): Observable<RecentTransactions> {
    return this.get<RecentTransactions>('recent-transactions', filters);
  }

  private get<T>(endpoint: string, filters: AnalyticsFilters): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
      params: this.buildParams(filters),
      withCredentials: true,
    });
  }

  private buildParams(filters: AnalyticsFilters): HttpParams {
    let params = new HttpParams()
      .set('allLocations', filters.allLocations)
      .set('interval', filters.interval)
      .set('dimension', filters.dimension)
      .set('limit', filters.limit)
      .set('page', filters.page)
      .set('pageSize', filters.pageSize);

    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.locationId !== undefined) {
      params = params.set('locationId', filters.locationId);
    }
    if (filters.paymentMethod !== undefined) {
      params = params.set('paymentMethod', filters.paymentMethod);
    }

    return params;
  }
}
