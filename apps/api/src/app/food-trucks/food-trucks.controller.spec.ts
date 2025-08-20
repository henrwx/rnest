import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FoodTrucksController } from './food-trucks.controller';
import { FoodTrucksService } from './food-trucks.service';

describe('FoodTrucksController', () => {
  let controller: FoodTrucksController;
  let service: FoodTrucksService;

  const mockSearchResult = {
    data: [
      {
        id: '1',
        applicant: 'Tacos El Primo',
        status: 'APPROVED',
        address: '123 Mission St',
      },
    ],
    total: 1,
    pagination: {
      limit: 10,
      offset: 0,
      hasMore: false,
    },
  };

  const mockFoodTrucksService = {
    searchByName: jest.fn(),
    /**
     * TODO:
     *   (1) searchByAddress: jest.fn()
     *   (2) findNearby: jest.fn()
     */
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodTrucksController],
      providers: [
        {
          provide: FoodTrucksService,
          useValue: mockFoodTrucksService,
        },
      ],
    }).compile();

    controller = module.get<FoodTrucksController>(FoodTrucksController);
    service = module.get<FoodTrucksService>(FoodTrucksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchByName', () => {
    it('should return search results when valid name is provided', async () => {
      const query = {
        name: 'Tacos',
        status: 'APPROVED',
        limit: 10,
        offset: 0,
      };

      mockFoodTrucksService.searchByName.mockResolvedValue(mockSearchResult);

      const result = await controller.searchByName(query);

      expect(result).toEqual(mockSearchResult);
      expect(service.searchByName).toHaveBeenCalledWith('Tacos', 'APPROVED', {
        limit: 10,
        offset: 0,
      });
    });

    it('should throw BadRequestException when name is empty', async () => {
      const query = {
        name: '',
        limit: 10,
        offset: 0,
      };

      await expect(controller.searchByName(query)).rejects.toThrow(
        BadRequestException
      );

      await expect(controller.searchByName(query)).rejects.toThrow(
        'Name parameter is required'
      );
    });

    it('should use default pagination when not provided', async () => {
      const query = {
        name: 'Pizza',
      };

      mockFoodTrucksService.searchByName.mockResolvedValue(mockSearchResult);

      await controller.searchByName(query);

      expect(service.searchByName).toHaveBeenCalledWith('Pizza', undefined, {
        limit: 10,
        offset: 0,
      });
    });
  });

  /**
   * TODO:
   *   (1) Search by address
   *   (2) Nearby (food trucks)
   */
});
