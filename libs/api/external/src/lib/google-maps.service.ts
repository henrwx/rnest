import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GoogleMapsService {
  private readonly apiKey: string | undefined =
    process.env.GOOGLE_MAPS_API_KEY || undefined;

  private readonly googleComputeRouteUrl: string =
    'https://routes.googleapis.com/directions/v2:computeRoutes';

  /**
   * Get driving distance between two points using Google Routes API. Distance
   * returned in kilometers.
   */
  async getDrivingDistance(
    originLat: number,
    originLong: number,
    destLat: number,
    destLong: number
  ): Promise<number> {
    const body = {
      origin: {
        location: {
          latLng: { latitude: originLat, longitude: originLong },
        },
      },
      destination: {
        location: {
          latLng: { latitude: destLat, longitude: destLong },
        },
      },
      travelMode: 'DRIVE',
    };

    try {
      if (!this.apiKey) {
        throw new Error('No Google API key found');
      }

      const response = await axios.post(this.googleComputeRouteUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        },
      });

      const route = response.data.routes?.[0]; /* Choosing first route */

      if (!route) {
        throw new Error('No routes found');
      }

      return route.distanceMeters / 1000;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new InternalServerErrorException(
          `Google Routes API failed: ${
            error.response?.data?.error?.message ?? error.message
          }`
        );
      }
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Google Routes API failed: ${error.message}`
        );
      }
      throw new InternalServerErrorException(
        `Google Routes API failed: Unexpected error`
      );
    }
  }
}
