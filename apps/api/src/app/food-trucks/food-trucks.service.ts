import { Injectable } from '@nestjs/common';
import { PrismaService } from '@rnest/database';
import { FoodTruck, Prisma } from '@prisma/client';
import { GoogleMapsService } from '@rnest/external';

interface PaginationOptions {
  limit: number;
  offset: number;
}

interface FindNearbyOptions {
  radius: number;
  status: string;
  limit: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

@Injectable()
export class FoodTrucksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMapsService: GoogleMapsService
  ) {}

  async searchByName(
    name: string,
    status?: string,
    pagination: PaginationOptions = { limit: 10, offset: 0 }
  ): Promise<SearchResult<FoodTruck>> {
    const whereClause: Prisma.FoodTruckWhereInput = {
      applicant: {
        contains: name,
        mode: 'insensitive',
      },
    };

    if (status) {
      whereClause.status = {
        equals: status,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.foodTruck.findMany({
        where: whereClause,
        orderBy: [{ applicant: 'asc' }, { createdAt: 'desc' }],
        take: pagination.limit,
        skip: pagination.offset,
      }),
      /* Normally, would just get result and check length */
      this.prisma.foodTruck.count({
        where: whereClause,
      }),
    ]);

    return {
      data,
      total,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: pagination.offset + pagination.limit < total,
      },
    };
  }

  async searchByAddress(
    address: string,
    status?: string,
    pagination: PaginationOptions = { limit: 10, offset: 0 }
  ): Promise<SearchResult<FoodTruck>> {
    const whereClause: Prisma.FoodTruckWhereInput = {
      OR: [
        {
          address: {
            contains: address,
            mode: 'insensitive',
          },
        },
        {
          locationDescription: {
            contains: address,
            mode: 'insensitive',
          },
        },
      ],
    };

    if (status) {
      whereClause.status = {
        equals: status,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.foodTruck.findMany({
        where: whereClause,
        orderBy: [{ address: 'asc' }, { createdAt: 'desc' }],
        take: pagination.limit,
        skip: pagination.offset,
      }),
      /* Normally, would just get result and check length */
      this.prisma.foodTruck.count({
        where: whereClause,
      }),
    ]);

    return {
      data,
      total,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: pagination.offset + pagination.limit < total,
      },
    };
  }

  async findNearby(
    latitude: number,
    longitude: number,
    options: FindNearbyOptions = { radius: 5, status: 'APPROVED', limit: 5 }
  ): Promise<FoodTruck[]> {
    const whereClause: Prisma.FoodTruckWhereInput = {
      status: options.status,
    };

    const foodTrucks = await this.prisma.foodTruck.findMany({
      where: whereClause,
    });

    const trucksWithDistance = await Promise.all(
      foodTrucks.map(async (truck) => {
        const distance = await this.googleMapsService.getDrivingDistance(
          latitude,
          longitude,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          truck.latitude!,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          truck.longitude!
        );
        return { ...truck, distance };
      })
    );

    /**
     * Note: this radius and limiting strategy could be improved, e.g.:
     *   (1) Calculate the Haversine distance and filter based on a given radius
     *   (2) Calculate the driving distance with the Google Maps API
     *   (3) Sort and limit the results set, i.e. 5 nearest food trucks from a given point
     */
    const filteredTrucks = trucksWithDistance
      .filter((truck) => truck.distance <= options.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, options.limit);

    /* Remove the distance property before returning */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return filteredTrucks.map(({ distance, ...truck }) => truck);
  }
}
