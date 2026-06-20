export type AnalyticsInterval = 'auto' | 'day' | 'week' | 'month';
export type AnalyticsBreakdownDimension =
  | 'product'
  | 'category'
  | 'payment-method'
  | 'location'
  | 'staff';

export enum AnalyticsPaymentMethod {
  Cash = 1,
  Card = 2,
  Other = 3,
}

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  locationId?: number;
  allLocations: boolean;
  paymentMethod?: AnalyticsPaymentMethod;
  interval: AnalyticsInterval;
  dimension: AnalyticsBreakdownDimension;
  limit: number;
  page: number;
  pageSize: number;
}

export interface AnalyticsDateRange {
  from?: string;
  to?: string;
  start?: string;
  end?: string;
}

export interface RevenueSummary {
  dateRange: AnalyticsDateRange;
  lifetimeGrossRevenue: number;
  grossRevenue: number;
  netRevenue: number;
  taxCollected: number;
  discounts: number;
  transactionCount: number;
  averageTransactionValue: number;
  voidedTransactionCount: number;
  voidedGrossAmount: number;
  cancellationCount: number;
  cancellationGrossAmount: number;
  previousPeriodGrossRevenue: number;
  grossRevenueGrowthPercentage: number | null;
}

export interface RevenueTrendPoint {
  periodStart: string;
  periodEnd: string;
  label: string;
  grossRevenue: number;
  netRevenue: number;
  transactionCount: number;
}

export interface RevenueTrend {
  interval: Exclude<AnalyticsInterval, 'auto'>;
  dateRange: AnalyticsDateRange;
  data: RevenueTrendPoint[];
}

export interface RevenueBreakdownItem {
  key: string;
  label: string;
  grossRevenue: number;
  netRevenue: number;
  quantity?: number | null;
  transactionCount: number;
  revenuePercentage: number;
}

export interface RevenueBreakdown {
  dimension: AnalyticsBreakdownDimension;
  dateRange: AnalyticsDateRange;
  totalGrossRevenue: number;
  data: RevenueBreakdownItem[];
}

export interface RecentTransaction {
  dateTime?: string;
  timestamp?: string;
  date?: string;
  transactionNumber?: string;
  number?: string;
  location?: string;
  locationName?: string;
  staffMember?: string;
  staffName?: string;
  paymentMethod: AnalyticsPaymentMethod | string;
  status: 'completed' | 'voided' | string | number;
  isVoided?: boolean;
  grossRevenue: number;
  netRevenue: number;
  tax?: number;
  taxAmount?: number;
  discount?: number;
  discountAmount?: number;
}

export interface RecentTransactions {
  count: number;
  pages: number;
  page: number;
  pageSize: number;
  data: RecentTransaction[];
}

export interface AnalyticsCapabilities {
  customerAnalyticsAvailable: boolean;
  refundAnalyticsAvailable: boolean;
  cancellationAnalyticsAvailable: boolean;
  breakdownDimensions: AnalyticsBreakdownDimension[];
  notes: string[];
}

export interface AnalyticsDashboard {
  summary: RevenueSummary;
  trend: RevenueTrend;
  breakdown: RevenueBreakdown;
  recentTransactions: RecentTransactions;
  capabilities: AnalyticsCapabilities;
}
