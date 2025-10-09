import { Controller, Post, Get, Body, Param, UseGuards, Request, ValidationPipe, Patch, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { PlanType } from './entities/subscription.entity';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  // Admin only - Create subscription for any user
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  // User - Subscribe (upgrade from free to premium)
  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  async subscribe(
    @Request() req,
    @Body('planType') planType: PlanType,
  ) {
    const now = new Date();
    const duration = planType === PlanType.MONTHLY ? 30 : 365;
    const expiryDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

    const subscriptionDto: CreateSubscriptionDto = {
      userId: req.user.id,
      planType,
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      autoRenew: false,
    };

    return this.subscriptionsService.create(subscriptionDto);
  }

  // User - Get own subscription
  @Get('my-subscription')
  @UseGuards(AuthGuard('jwt'))
  async getMySubscription(@Request() req) {
    const subscription = await this.subscriptionsService.findByUserId(req.user.id);
    if (!subscription) {
      return { message: 'No active subscription', hasSubscription: false };
    }

    return {
      ...subscription,
      isValid: subscription.isValid(),
      daysRemaining: Math.ceil((new Date(subscription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    };
  }

  // User - Renew subscription
  @Patch('renew')
  @UseGuards(AuthGuard('jwt'))
  async renew(@Request() req, @Body('planType') planType: PlanType) {
    return this.subscriptionsService.renew(req.user.id, planType);
  }

  // User - Cancel subscription
  @Delete('cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancel(@Request() req) {
    await this.subscriptionsService.cancel(req.user.id);
    return { message: 'Subscription cancelled successfully' };
  }

  // Admin only - Get user subscription by ID
  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async getUserSubscription(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }
}