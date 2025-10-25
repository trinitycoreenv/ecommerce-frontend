const { faker } = require('@faker-js/faker');
const fetch = require('node-fetch');

jest.setTimeout(30000); // 30 seconds

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ShippoAddress {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
}

interface ShippoParcel {
  weight: number;
  height: number;
  width: number;
  length: number;
}

interface ValidationResponse {
  validation_results: any;
}

interface RatesResponse {
  rates: Array<{
    object_id: string;
  }>;
}

interface LabelResponse {
  label_url: string;
}

describe('Shipping Integration Tests', () => {
  const testAddress: ShippoAddress = {
    name: faker.person.fullName(),
    street1: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    country: 'US',
    email: faker.internet.email(),
    phone: faker.phone.number(),
  };

  const testProduct: ShippoParcel = {
    weight: Number(faker.number.float({ min: 0.1, max: 10, fractionDigits: 1 })),
    height: Number(faker.number.float({ min: 1, max: 20, fractionDigits: 1 })),
    width: Number(faker.number.float({ min: 1, max: 20, fractionDigits: 1 })),
    length: Number(faker.number.float({ min: 1, max: 20, fractionDigits: 1 })),
  };

  test('Address Validation', async () => {
    const response = await fetch(`${API_URL}/api/test/shippo/address-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAddress),
    });

    const data = await response.json() as ValidationResponse;
    expect(response.status).toBe(200);
    expect(data.validation_results).toBeDefined();
  });

  test('Get Shipping Rates', async () => {
    const response = await fetch(`${API_URL}/api/test/shippo/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromAddress: testAddress,
        toAddress: {
          ...testAddress,
          state: faker.location.state(),
          zip: faker.location.zipCode(),
        },
        parcel: testProduct,
      }),
    });

    const data = await response.json() as RatesResponse;
    expect(response.status).toBe(200);
    expect(Array.isArray(data.rates)).toBe(true);
    expect(data.rates.length).toBeGreaterThan(0);
  });

  test('Create Shipping Label', async () => {
    const ratesResponse = await fetch(`${API_URL}/api/test/shippo/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromAddress: testAddress,
        toAddress: {
          ...testAddress,
          state: faker.location.state(),
          zip: faker.location.zipCode(),
        },
        parcel: testProduct,
      }),
    });

    const ratesData = await ratesResponse.json() as RatesResponse;
    const rate = ratesData.rates[0];

    const labelResponse = await fetch(`${API_URL}/api/test/shippo/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate: rate.object_id,
        async: false,
      }),
    });

    const labelData = await labelResponse.json() as LabelResponse;
    expect(labelResponse.status).toBe(200);
    expect(labelData.label_url).toBeDefined();
  });
});