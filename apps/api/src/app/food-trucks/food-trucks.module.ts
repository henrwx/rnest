import { Module } from '@nestjs/common';
import { FoodTrucksController } from './food-trucks.controller';
import { FoodTrucksService } from './food-trucks.service';
import { DatabaseModule } from '@rnest/database';
import { ExternalModule } from '@rnest/external';

@Module({
  imports: [DatabaseModule, ExternalModule],
  controllers: [FoodTrucksController],
  providers: [FoodTrucksService],
  exports: [FoodTrucksService],
})
export class FoodTrucksModule {}
