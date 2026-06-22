import { formatTaxHistoryDateTime } from './tax-details.component';

describe('tax history date formatting', () => {
  it('formats a backend UTC timestamp as a readable date and time', () => {
    expect(
      formatTaxHistoryDateTime(
        '2026-06-22T20:57:42.4877584',
        'en-US',
        'UTC'
      )
    ).toBe('Jun 22, 2026, 8:57 PM');
  });

  it('keeps an invalid timestamp visible instead of throwing', () => {
    expect(formatTaxHistoryDateTime('invalid-date', 'en-US', 'UTC'))
      .toBe('invalid-date');
  });
});
