
import { ShippingService } from './shipping';
import { getShippo } from '../clients/shippo';

jest.mock('../clients/shippo', () => ({
  getShippo: jest.fn(),
}));

describe('ShippingService', () => {
  let shippoMock: any;

  beforeEach(() => {
    shippoMock = {
      shipments: {
        create: jest.fn(),
      },
      transactions: {
        create: jest.fn(),
      },
      trackingStatus: {
        get: jest.fn(),
      },
    };
    (getShippo as jest.Mock).mockReturnValue(shippoMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getShippingRates', () => {
    it('should fetch and map Shippo rates', async () => {
      const fromAddress = { name: 'Admin', address1: '456 Oak Ave', city: 'Anytown', state: 'CA', zip: '12345', country: 'US' };
      const toAddress = { name: 'John Doe', address1: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345', country: 'US' };
      const packageInfo = { length: 10, width: 8, height: 4, weight: 2, unit: 'in' as const };

      const mockShipment = {
        rates: [
          {
            object_id: 'rate_1',
            amount: '10.00',
            currency: 'USD',
            provider: 'UPS',
            servicelevel: { name: 'Ground', token: 'ups_ground' },
            estimated_days: 2,
            duration_terms: '2 business days',
          },
        ],
      };

      shippoMock.shipments.create.mockResolvedValue(mockShipment);

      const rates = await ShippingService.getShippingRates(fromAddress, toAddress, packageInfo);

      expect(shippoMock.shipments.create).toHaveBeenCalledWith({
        addressFrom: expect.any(Object),
        addressTo: expect.any(Object),
        parcels: [expect.any(Object)],
        async: false,
      });

      expect(rates).toHaveLength(1);
      expect(rates[0]).toEqual({
        service: 'Ground',
        serviceCode: 'ups_ground',
        carrier: 'UPS',
        cost: 10.00,
        currency: 'USD',
        estimatedDays: 2,
        estimatedDelivery: expect.any(Date),
        description: '2 business days',
      });
    });
  describe('createShippingLabel', () => {
    it('should create a Shippo label', async () => {
      const fromAddress = { name: 'Admin', address1: '456 Oak Ave', city: 'Anytown', state: 'CA', zip: '12345', country: 'US' };
      const toAddress = { name: 'John Doe', address1: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345', country: 'US' };
      const packageInfo = { length: 10, width: 8, height: 4, weight: 2, unit: 'in' as const };
      const service = 'ups_ground';
      const carrier = 'UPS';
      const orderId = 'order_123';

      const mockShipment = {
        rates: [
          {
            object_id: 'rate_1',
            amount: '10.00',
            currency: 'USD',
            provider: 'UPS',
            servicelevel: { name: 'Ground', token: 'ups_ground' },
          },
        ],
      };

      const mockTransaction = {
        object_id: 'transaction_1',
        tracking_number: '1Z12345E0205271688',
        label_url: 'https://shippo-static.com/labels/label.pdf',
        tracking_url_provider: 'https://www.ups.com/track?track=yes&trackNums=1Z12345E0205271688',
        amount: '10.00',
        currency: 'USD',
        status: 'SUCCESS',
      };

      shippoMock.shipments.create.mockResolvedValue(mockShipment);
      shippoMock.transactions.create.mockResolvedValue(mockTransaction);

      const label = await ShippingService.createShippingLabel(fromAddress, toAddress, packageInfo, service, carrier, orderId);

      expect(shippoMock.shipments.create).toHaveBeenCalledWith({
        addressFrom: expect.any(Object),
        addressTo: expect.any(Object),
        parcels: [expect.any(Object)],
        async: false,
      });

      expect(shippoMock.transactions.create).toHaveBeenCalledWith({
        rate: 'rate_1',
        labelFileType: 'PDF',
        async: false,
      });

      expect(label).toEqual({
        id: 'transaction_1',
        trackingNumber: '1Z12345E0205271688',
        labelUrl: 'https://shippo-static.com/labels/label.pdf',
        trackingUrl: 'https://www.ups.com/track?track=yes&trackNums=1Z12345E0205271688',
        cost: 10.00,
        currency: 'USD',
        service: 'Ground',
        carrier: 'UPS',
        status: 'PURCHASED',
        createdAt: expect.any(Date),
      });
    });
  });
