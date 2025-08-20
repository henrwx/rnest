import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { FoodTrucksService } from './food-trucks.service';
import {
  FindNearbyDto,
  SearchByAddressDto,
  SearchByNameDto,
} from './dto/food-trucks.dto';

@Controller('food-trucks')
export class FoodTrucksController {
  constructor(private readonly foodTrucksService: FoodTrucksService) {}

  @Get('search')
  async searchByName(@Query() query: SearchByNameDto) {
    if (!query.name || query.name.trim().length === 0) {
      throw new BadRequestException('Name parameter is required');
    }

    const pagination = {
      limit: query.limit || 10,
      offset: query.offset || 0,
    };

    return this.foodTrucksService.searchByName(
      query.name.trim(),
      query.status,
      pagination
    );
  }

  @Get('search-by-address')
  async searchByAddress(@Query() query: SearchByAddressDto) {
    if (!query.address || query.address.trim().length === 0) {
      throw new BadRequestException('Address parameter is required');
    }

    const pagination = {
      limit: query.limit || 10,
      offset: query.offset || 0,
    };

    return this.foodTrucksService.searchByAddress(
      query.address.trim(),
      query.status,
      pagination
    );
  }

  @Get('nearby')
  async findNearby(@Query() query: FindNearbyDto) {
    const latitude = parseFloat(query.lat as unknown as string);
    const longitude = parseFloat(query.long as unknown as string);

    /**
     * Note: can refactor out "is valid lat/long" checks
     */
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException(
        'Valid latitude and longitude are required'
      );
    }

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }

    const options = {
      radius: query.radius || 5,
      status: query.status || 'APPROVED',
      limit: query.limit || 5,
    };

    return this.foodTrucksService.findNearby(latitude, longitude, options);
  }
}
