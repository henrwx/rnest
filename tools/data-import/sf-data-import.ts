import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

interface SFGovFoodTruck {
  objectid: string;
  applicant: string;
  facilitytype?: string;
  cnn?: string;
  locationdescription?: string;
  address?: string;
  blocklot?: string;
  block?: string;
  lot?: string;
  permit?: string;
  status: string;
  fooditems?: string;
  x?: string;
  y?: string;
  latitude?: string;
  longitude?: string;
  schedule?: string;
  approved?: string;
  received?: string;
  priorpermit?: string;
  expirationdate?: string;
  location?: {
    latitude?: string;
    longitude?: string;
    human_address?: string;
  };
}

interface ImportStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
}

class SFDataImporter {
  private stats: ImportStats = {
    total: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  /**
   * Parse coordinate string to float, handling edge cases.
   */
  private parseCoordinate(coord: string | undefined): number | null {
    if (!coord || coord === '0' || coord === '0.0' || coord.trim() === '') {
      return null;
    }
    const parsed = parseFloat(coord);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse date string handling multiple formats.
   */
  private parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;

    /* Handle YYYYMMDD format like "20190801", where month is 0-indexed */
    if (/^\d{8}$/.test(dateStr)) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    }

    /* Handle ISO format like "2024-11-12T00:00:00.000" */
    try {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  /**
   * Transform SF Gov data to database schema.
   */
  private transformRecord(sfData: SFGovFoodTruck) {
    const latitude = this.parseCoordinate(sfData.latitude);
    const longitude = this.parseCoordinate(sfData.longitude);

    return {
      objectId: sfData.objectid,
      applicant: sfData.applicant.trim(),
      facilityType: sfData.facilitytype?.trim() || null,
      cnn: sfData.cnn?.trim() || null,
      locationDescription: sfData.locationdescription?.trim() || null,
      address: sfData.address?.trim() || null,
      blockLot: sfData.blocklot?.trim() || null,
      block: sfData.block?.trim() || null,
      lot: sfData.lot?.trim() || null,
      permit: sfData.permit?.trim() || null,
      status: sfData.status.trim(),
      foodItems: sfData.fooditems?.trim() || null,
      x: this.parseCoordinate(sfData.x),
      y: this.parseCoordinate(sfData.y),
      latitude,
      longitude,
      schedule: sfData.schedule?.trim() || null,
      approved: this.parseDate(sfData.approved),
      received: sfData.received?.trim() || null,
      priorPermit: sfData.priorpermit?.trim() || null,
      expirationDate: this.parseDate(sfData.expirationdate),
    };
  }

  /**
   * Fetch data from SF Gov API.
   */
  private async fetchSFData(): Promise<SFGovFoodTruck[]> {
    const apiUrl = process.env.SF_GOV_API_URL;
    const appToken = process.env.SF_GOV_APP_TOKEN;

    if (!apiUrl) {
      throw new Error('SF_GOV_API_URL environment variable is required');
    }

    if (!appToken) {
      throw new Error('SF_GOV_APP_TOKEN environment variable is required');
    }

    console.log('🔄 Fetching data from SF Gov API...');
    console.log(`   URL: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'X-App-Token': appToken,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Expected array response from SF Gov API');
      }

      console.log(`✅ Successfully fetched ${data.length} records`);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch SF data:', error);
      throw error;
    }
  }

  /**
   * Import a single record with upsert logic.
   */
  private async importRecord(record: ReturnType<typeof this.transformRecord>) {
    try {
      const result = await prisma.foodTruck.upsert({
        where: { objectId: record.objectId },
        update: {
          ...record,
          updatedAt: new Date(),
        },
        create: record,
        select: { id: true, createdAt: true, updatedAt: true },
      });

      const wasUpdated =
        result.createdAt.getTime() !== result.updatedAt.getTime();

      if (wasUpdated) {
        this.stats.updated++;
      } else {
        this.stats.imported++;
      }
    } catch (error) {
      this.stats.errors++;
      console.error(`❌ Error importing record ${record.objectId}:`, error);
    }
  }

  /**
   * Main import function.
   */
  async import(options: { dryRun?: boolean; batchSize?: number } = {}) {
    const { dryRun = false, batchSize = 100 } = options;

    console.log('🚀 Starting SF Food Truck data import...');

    if (dryRun) {
      console.log('🧪 DRY RUN MODE - No data will be written to database');
    }

    try {
      const rawData = await this.fetchSFData();
      this.stats.total = rawData.length;

      console.log('🔄 Transforming data...');
      const validRecords: ReturnType<typeof this.transformRecord>[] = [];

      for (const rawRecord of rawData) {
        try {
          const transformed = this.transformRecord(rawRecord);

          /* Skipping records without coordinates */
          if (transformed.latitude === null || transformed.longitude === null) {
            this.stats.skipped++;
            continue;
          }

          /* Skipping records with invalid coordinates */
          if (
            Math.abs(transformed.latitude) > 90 ||
            Math.abs(transformed.longitude) > 180
          ) {
            this.stats.skipped++;
            continue;
          }

          validRecords.push(transformed);
        } catch (error) {
          this.stats.errors++;
          console.error(
            `❌ Error transforming record ${rawRecord.objectid}:`,
            error
          );
        }
      }

      console.log(`✅ Transformed ${validRecords.length} valid records`);
      console.log(
        `⚠️ Skipped ${this.stats.skipped} records (missing/invalid coordinates)`
      );

      if (dryRun) {
        this.printStats();
        console.log('🧪 Dry run complete - no data was written to database');
        return;
      }

      console.log('🔄 Importing to database...');
      for (let i = 0; i < validRecords.length; i += batchSize) {
        const batch = validRecords.slice(i, i + batchSize);

        console.log(
          `   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            validRecords.length / batchSize
          )}`
        );

        await Promise.all(batch.map((record) => this.importRecord(record)));
      }

      console.log('✅ Import completed successfully!');
      this.printStats();
    } catch (error) {
      console.error('❌ Import failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Print import statistics
   */
  private printStats() {
    console.log('\n📊 Import Statistics:');
    console.log(`   Total records fetched: ${this.stats.total}`);
    console.log(`   New records imported: ${this.stats.imported}`);
    console.log(`   Existing records updated: ${this.stats.updated}`);
    console.log(`   Records skipped: ${this.stats.skipped}`);
    console.log(`   Errors: ${this.stats.errors}`);
  }

  /**
   * Analyze imported data
   */
  async analyze() {
    console.log('\n🔍 Analyzing imported data...');

    try {
      const statusStats = await prisma.foodTruck.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { _count: { status: 'desc' } },
      });

      console.log('\n📈 Status Distribution:');

      statusStats.forEach((stat) => {
        console.log(`   ${stat.status}: ${stat._count.status}`);
      });

      const facilityStats = await prisma.foodTruck.groupBy({
        by: ['facilityType'],
        _count: { facilityType: true },
        orderBy: { _count: { facilityType: 'desc' } },
      });

      console.log('\n🚚 Facility Type Distribution:');

      facilityStats.forEach((stat) => {
        console.log(
          `   ${stat.facilityType || 'Unknown'}: ${stat._count.facilityType}`
        );
      });

      const totalRecords = await prisma.foodTruck.count();
      const withCoordinates = await prisma.foodTruck.count({
        where: {
          AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
        },
      });

      console.log('\n🗺️ Coordinate Quality:');
      console.log(`   Total records: ${totalRecords}`);
      console.log(`   With valid coordinates: ${withCoordinates}`);
      console.log(`   Missing coordinates: ${totalRecords - withCoordinates}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }
}

/**
 * CLI functionality
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const analyze = args.includes('--analyze');

  const importer = new SFDataImporter();

  try {
    if (analyze) {
      await importer.analyze();
    } else {
      await importer.import({ dryRun });
      if (!dryRun) {
        await importer.analyze();
      }
    }
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

/* If called directly */
if (require.main === module) {
  main();
}

export { SFDataImporter };
