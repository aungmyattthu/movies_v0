import { IsEnum, IsUUID, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { PlanType } from '../entities/subscription.entity';
import { Subscription } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsUUID()
  userId: string;

  @IsEnum(PlanType)
  planType: PlanType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  expiryDate: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}