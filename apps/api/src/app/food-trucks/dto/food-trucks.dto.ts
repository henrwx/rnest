import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class SearchByNameDto extends PaginationDto {
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class SearchByAddressDto extends PaginationDto {
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class FindNearbyDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  long!: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radius?: number = 5;

  @IsOptional()
  @IsString()
  status?: string = 'APPROVED';

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 5;
}
