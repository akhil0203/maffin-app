import axios from 'axios';

import * as yh from '../yahoo';

jest.mock('axios');

describe('getPrice', () => {
  let mockAxiosGet: jest.SpyInstance;

  beforeEach(() => {
    mockAxiosGet = jest.spyOn(axios, 'get').mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: 'USD',
                chartPreviousClose: 1.79,
                regularMarketPrice: 1.89,
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls api with expected params', async () => {
    const result = await yh.getPrice('ticker', 1684139670);

    expect(mockAxiosGet).toHaveBeenNthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v8/finance/chart/ticker?interval=1d&includePrePost=false&period1=1684108800&period2=1684195199',
    );
    expect(result).toEqual({
      currency: 'USD',
      price: 1.89,
      changePct: 5.59,
      changeAbs: 0.1,
    });
  });

  it('fails when axios call fails', async () => {
    mockAxiosGet.mockRejectedValue({
      message: 'message',
      url: 'url',
      response: {
        status: 500,
      },
    });

    await expect(yh.getPrice('ticker', 1684139670)).rejects.toThrow(
      'ticker failed: message',
    );
  });

  it('fails when unknown ticker', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: null,
          error: {
            code: 'Not Found',
            description: 'No data found, symbol may be delisted',
          },
        },
      },
      status: 404,
    }));

    await expect(yh.getPrice('ticker', 1684139670)).rejects.toThrow(
      'ticker \'ticker\' not found',
    );
  });

  it('fails when unknown error', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: null,
          error: {
            code: 'Unknown error',
            description: 'error message',
          },
        },
      },
      status: 404,
    }));

    await expect(yh.getPrice('ticker', 1684139670)).rejects.toThrow(
      'error message',
    );
  });

  /**
   * Yahoo finance sometimes returns 0 for previousClosePrice and it breaks our numbers. This is
   * a patch for it
   */
  it('sets previous close same as current price when previous close is 0', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: 'EUR',
                chartPreviousClose: 0,
                regularMarketPrice: 212.5,
              },
            },
          ],
          error: null,
        },
      },
      status: 404,
    }));

    const resp = await yh.getPrice('ticker');

    expect(resp).toEqual({
      price: 212.5,
      changePct: 0,
      changeAbs: 0,
      currency: 'EUR',
    });
  });

  it('queries for previous day when on Sunday', async () => {
    await yh.getPrice('ticker', 1696089600);

    expect(mockAxiosGet).nthCalledWith(
      1,
      'https://query2.finance.yahoo.com/v8/finance/chart/ticker?interval=1d&includePrePost=false&period1=1695945600&period2=1696031999',
    );
  });

  it('returns price *100 from http request call when GBp', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: 'GBp',
                chartPreviousClose: 210,
                regularMarketPrice: 212.5,
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));

    const resp = await yh.getPrice('ticker');

    expect(resp).toEqual({
      price: 2.125,
      changePct: 1.19,
      changeAbs: 0.02,
      currency: 'GBP',
    });
  });

  it('does not return price *100 from http request call when GBP', async () => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: 'GBP',
                chartPreviousClose: 2.1,
                regularMarketPrice: 2.125,
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));

    const resp = await yh.getPrice('ticker');

    expect(resp).toEqual({
      price: 2.125,
      changePct: 1.19,
      changeAbs: 0.02,
      currency: 'GBP',
    });
  });

  it.each([
    ['PHPSGD=X', 'SGDPHP=X', 1 / 100],
    ['EURSGD=X', 'EURSGD=X', 100],
  ])('formats %s to have main currency first', async (ticker, expected, price) => {
    mockAxiosGet.mockImplementation(() => Promise.resolve({
      data: {
        chart: {
          result: [
            {
              meta: {
                currency: 'USD',
                chartPreviousClose: 90,
                regularMarketPrice: 100,
              },
            },
          ],
          error: null,
        },
      },
      status: 200,
      statusText: 'OK',
    }));

    const result = await yh.getPrice(ticker);

    expect(mockAxiosGet).toBeCalledWith(
      `https://query2.finance.yahoo.com/v8/finance/chart/${expected}?interval=1d&includePrePost=false`,
    );
    expect(result).toEqual(expect.objectContaining({
      price,
    }));
  });
});
