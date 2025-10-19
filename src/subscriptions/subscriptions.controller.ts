import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { PlanType } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create subscription for any user (Admin only)',
    description: 'Allows admin to create a subscription for any user',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'User already has a subscription' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async create(
    @Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Subscribe to a plan',
    description: 'User subscribes to monthly or yearly plan',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'User already has a subscription' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async subscribe(
    @Request() req: RequestWithUser,
    @Body(ValidationPipe) subscribeDto: SubscribeDto,
  ) {
    const now = new Date();
    const duration = subscribeDto.planType === PlanType.MONTHLY ? 30 : 365;
    const expiryDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

    const subscriptionDto: CreateSubscriptionDto = {
      userId: req.user.id,
      planType: subscribeDto.planType,
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      autoRenew: false,
    };

    return this.subscriptionsService.create(subscriptionDto);
  }

  @Get('my-subscription')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my subscription',
    description: 'Returns current user subscription details',
  })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMySubscription(@Request() req: RequestWithUser) {
    const subscription = await this.subscriptionsService.findByUserId(
      req.user.id,
    );
    if (!subscription) {
      return { message: 'No active subscription', hasSubscription: false };
    }

    return {
      ...subscription,
      isValid: subscription.isValid(),
      daysRemaining: Math.ceil(
        (new Date(subscription.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    };
  }

  @Patch('renew')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Renew subscription',
    description: 'Renews user subscription with specified plan',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async renew(
    @Request() req: RequestWithUser,
    @Body(ValidationPipe) subscribeDto: SubscribeDto,
  ) {
    return this.subscriptionsService.renew(req.user.id, subscribeDto.planType);
  }

  @Delete('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancels current user subscription',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(@Request() req: RequestWithUser) {
    await this.subscriptionsService.cancel(req.user.id);
    return { message: 'Subscription cancelled successfully' };
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user subscription (Admin only)',
    description: 'Returns subscription details for specified user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getUserSubscription(@Param('userId') userId: string) {
    return this.subscriptionsService.findByUserId(userId);
  }
}
