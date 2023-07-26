import React from 'react';
import { DateTime } from 'luxon';
import { render } from '@testing-library/react';

import type { Split } from '@/book/entities';
import Chart from '@/components/charts/Chart';
import SplitsHistogram from '@/components/pages/account/SplitsHistogram';

jest.mock('@/components/charts/Chart', () => jest.fn(
  () => <div data-testid="Chart" />,
));
const ChartMock = Chart as jest.MockedFunction<typeof Chart>;

describe('SplitsHistogram', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates Chart with expected params', () => {
    const { container } = render(<SplitsHistogram splits={[]} />);

    expect(Chart).toBeCalledWith(
      {
        series: [],
        title: 'Total per month',
        type: 'bar',
        unit: '',
        xCategories: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ],
        events: {
          mounted: expect.any(Function),
        },
        plotOptions: {
          bar: {
            columnWidth: '55%',
            horizontal: false,
          },
        },
      },
      {},
    );
    expect(container).toMatchSnapshot();
  });

  it('builds series accumulating values', () => {
    // note that splits are received ordered already. Without order, it will compute
    // wrongly
    render(
      <SplitsHistogram
        splits={[
          {
            account: {
              type: 'ASSET',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2023-01-02', { zone: 'utc' }),
            },
            quantity: 100,
          } as Split,
          {
            account: {
              // This is not very accurate as type is always the same but
              // this way we test INCOME behavior in this same test
              type: 'INCOME',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2022-01-01', { zone: 'utc' }),
            },
            quantity: -200,
          } as Split,
        ]}
      />,
    );

    expect(Chart).toBeCalledWith(
      {
        series: [
          {
            data: [
              {
                x: 'Jan',
                y: 200,
              },
              {
                x: 'Feb',
                y: 0,
              },
              {
                x: 'Mar',
                y: 0,
              },
              {
                x: 'Apr',
                y: 0,
              },
              {
                x: 'May',
                y: 0,
              },
              {
                x: 'Jun',
                y: 0,
              },
              {
                x: 'Jul',
                y: 0,
              },
              {
                x: 'Aug',
                y: 0,
              },
              {
                x: 'Sep',
                y: 0,
              },
              {
                x: 'Oct',
                y: 0,
              },
              {
                x: 'Nov',
                y: 0,
              },
              {
                x: 'Dec',
                y: 0,
              },
            ],
            name: '2022',
          },
          {
            data: [
              {
                x: 'Jan',
                y: 100,
              },
              {
                x: 'Feb',
                y: 0,
              },
              {
                x: 'Mar',
                y: 0,
              },
              {
                x: 'Apr',
                y: 0,
              },
              {
                x: 'May',
                y: 0,
              },
              {
                x: 'Jun',
                y: 0,
              },
              {
                x: 'Jul',
                y: 0,
              },
              {
                x: 'Aug',
                y: 0,
              },
              {
                x: 'Sep',
                y: 0,
              },
              {
                x: 'Oct',
                y: 0,
              },
              {
                x: 'Nov',
                y: 0,
              },
              {
                x: 'Dec',
                y: 0,
              },
            ],
            name: '2023',
          },
        ],
        title: 'Total per month',
        type: 'bar',
        unit: '€',
        xCategories: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ],
        events: {
          mounted: expect.any(Function),
        },
        plotOptions: {
          bar: {
            columnWidth: '55%',
            horizontal: false,
          },
        },
      },
      {},
    );
  });

  it('hides all series except last', () => {
    render(
      <SplitsHistogram
        splits={[
          {
            account: {
              type: 'ASSET',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2023-01-02', { zone: 'utc' }),
            },
            quantity: 100,
          } as Split,
          {
            account: {
              // This is not very accurate as type is always the same but
              // this way we test INCOME behavior in this same test
              type: 'INCOME',
              commodity: {
                mnemonic: 'EUR',
              },
            },
            transaction: {
              date: DateTime.fromISO('2022-01-01', { zone: 'utc' }),
            },
            quantity: -200,
          } as Split,
        ]}
      />,
    );

    const mountedEvent = ChartMock.mock.calls[0][0].events?.mounted as Function;
    const mockHideSeries = jest.fn();
    mountedEvent({ hideSeries: mockHideSeries });
    expect(mockHideSeries).toBeCalledTimes(1);
    expect(mockHideSeries).toBeCalledWith('2022');
  });
});