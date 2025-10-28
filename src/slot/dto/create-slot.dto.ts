import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSlotDto {
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  slots!: number;
}
