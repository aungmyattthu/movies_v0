import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '../entities/subscription.entity';

export class SubscribeDto {
  @ApiProperty({
    description: 'Subscription plan type',
    enum: PlanType,
    example: PlanType.MONTHLY,
  })
  @IsEnum(PlanType)
  planType: PlanType;
}
