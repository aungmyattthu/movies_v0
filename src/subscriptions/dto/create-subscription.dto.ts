import { IsEnum, IsUUID, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'User ID for the subscription',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Subscription plan type',
    enum: PlanType,
    example: PlanType.MONTHLY,
  })
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiProperty({
    description: 'Subscription start date',
    example: '2025-10-19T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Subscription expiry date',
    example: '2025-11-19T00:00:00.000Z',
  })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Auto-renew subscription',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}