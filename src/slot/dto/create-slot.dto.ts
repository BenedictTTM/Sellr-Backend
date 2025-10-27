import { IsInt, IsPositive } from 'class-validator';

export class CreateSlotDto {
  @IsInt()
  userId!: number;

  @IsInt()
  @IsPositive()
  slots!: number;
}
