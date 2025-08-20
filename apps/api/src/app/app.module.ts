import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@rnest/database';
import { FoodTrucksModule } from './food-trucks/food-trucks.module';
import { FoodTrucksController } from './food-trucks/food-trucks.controller';
import { FoodTrucksService } from './food-trucks/food-trucks.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    FoodTrucksModule,
  ],
  controllers: [FoodTrucksController],
  providers: [FoodTrucksService],
})
export class AppModule {}
