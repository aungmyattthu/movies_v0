import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PlanType, Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const existing = await this.findByUserId(createSubscriptionDto.userId);
    if (existing) {
      throw new BadRequestException('User already has a subscription');
    }

    const subscription = this.subscriptionsRepository.create(
      createSubscriptionDto,
    );
    return this.subscriptionsRepository.save(subscription);
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({ where: { userId } });
  }

  async checkValidity(userId: string): Promise<boolean> {
    const subscription = await this.findByUserId(userId);
    return subscription ? subscription.isValid() : false;
  }

  async renew(userId: string, planType: PlanType): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    const duration = planType === PlanType.MONTHLY ? 30 : 365;

    subscription.planType = planType;
    subscription.startDate = now;
    subscription.expiryDate = new Date(
      now.getTime() + duration * 24 * 60 * 60 * 1000,
    );
    subscription.isActive = true;

    return this.subscriptionsRepository.save(subscription);
  }

  async cancel(userId: string): Promise<void> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.isActive = false;
    subscription.autoRenew = false;
    await this.subscriptionsRepository.save(subscription);
  }
}
