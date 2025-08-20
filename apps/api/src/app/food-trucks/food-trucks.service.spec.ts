import { Test, TestingModule } from '@nestjs/testing';
import { FoodTrucksService } from './food-trucks.service';
import { PrismaService } from '@rnest/database';
import { GoogleMapsService } from '@rnest/external';

/* Mock food truck data */
const mockFoodTrucks = [
  {
    id: '1',
    objectId: 'obj-1',
    applicant: 'Tacos El Primo',
    facilityType: 'Truck',
    status: 'APPROVED',
    address: '123 Mission St',
    latitude: 37.7749,
    longitude: -122.4194,
    createdAt: new Date(),
    updatedAt: new Date(),
    cnn: null,
    locationDescription: null,
    blockLot: null,
    block: null,
    lot: null,
    permit: null,
    foodItems: 'Tacos, Burritos',
    x: null,
    y: null,
    schedule: null,
    approved: new Date(),
    received: null,
    priorPermit: null,
    expirationDate: new Date('2024-12-31'),
  },
  {
    id: '2',
    objectId: 'obj-2',
    applicant: 'Burger Palace Mobile',
    facilityType: 'Truck',
    status: 'APPROVED',
    address: '456 Market St',
    latitude: 37.7849,
    longitude: -122.4094,
    createdAt: new Date(),
    updatedAt: new Date(),
    cnn: null,
    locationDescription: null,
    blockLot: null,
    block: null,
    lot: null,
    permit: null,
    foodItems: 'Burgers, Fries',
    x: null,
    y: null,
    schedule: null,
    approved: new Date(),
    received: null,
    priorPermit: null,
    expirationDate: new Date('2024-12-31'),
  },
];

describe('FoodTrucksService', () => {
  let foodTrucksService: FoodTrucksService;

  const mockPrismaService = {
    foodTruck: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  /* Not used but including to show mocking */
  const mockGoogleMapsService = {
    calculateDistance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodTrucksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GoogleMapsService,
          useValue: mockGoogleMapsService,
        },
      ],
    }).compile();

    foodTrucksService = module.get<FoodTrucksService>(FoodTrucksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchByName', () => {
    it('should return food trucks matching the search name', async () => {
      const searchName = 'Tacos';

      const expectedResult = {
        data: [mockFoodTrucks[0]] /* First mock food truck */,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      mockPrismaService.foodTruck.findMany.mockResolvedValue([
        mockFoodTrucks[0],
      ]);

      mockPrismaService.foodTruck.count.mockResolvedValue(1);

      const result = await foodTrucksService.searchByName(searchName);

      expect(result).toEqual(expectedResult);

      expect(mockPrismaService.foodTruck.findMany).toHaveBeenCalledWith({
        where: {
          applicant: {
            contains: searchName,
            mode: 'insensitive',
          },
        },
        orderBy: [{ applicant: 'asc' }, { createdAt: 'desc' }],
        take: 10,
        skip: 0,
      });

      expect(mockPrismaService.foodTruck.count).toHaveBeenCalledWith({
        where: {
          applicant: {
            contains: searchName,
            mode: 'insensitive',
          },
        },
      });
    });

    it('should filter by status when provided', async () => {
      const searchName = 'Burger';
      const status = 'APPROVED';
      const pagination = { limit: 5, offset: 0 };

      mockPrismaService.foodTruck.findMany.mockResolvedValue([
        mockFoodTrucks[1],
      ]);

      mockPrismaService.foodTruck.count.mockResolvedValue(1);

      await foodTrucksService.searchByName(searchName, status, pagination);

      expect(mockPrismaService.foodTruck.findMany).toHaveBeenCalledWith({
        where: {
          applicant: {
            contains: searchName,
            mode: 'insensitive',
          },
          status: {
            equals: status,
            mode: 'insensitive',
          },
        },
        orderBy: [{ applicant: 'asc' }, { createdAt: 'desc' }],
        take: 5,
        skip: 0,
      });
    });

    it('should return empty results when no matches found', async () => {
      const searchName = 'NonExistentTruck';

      mockPrismaService.foodTruck.findMany.mockResolvedValue([]);
      mockPrismaService.foodTruck.count.mockResolvedValue(0);

      const result = await foodTrucksService.searchByName(searchName);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  /**
   * TODO:
   *   (1) Search by address
   *   (2) Nearby (food trucks)
   */
});
