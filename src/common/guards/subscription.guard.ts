import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UserRole } from '../../roles/entities/role.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins bypass subscription check
    if (user.role.name === UserRole.ADMIN) {
      return true;
    }

    // Free users should not access this
    if (user.role.name === UserRole.FREE) {
      throw new ForbiddenException('Free users cannot access full movies. Please upgrade to premium.');
    }

    // Check premium subscription
    if (user.role.name === UserRole.PREMIUM) {
      const subscription = await this.subscriptionsService.findByUserId(user.id);
      
      if (!subscription) {
        throw new ForbiddenException('No active subscription found');
      }

      if (!subscription.isValid()) {
        throw new ForbiddenException('Your subscription has expired. Please renew to continue watching.');
      }

      return true;
    }

    return false;
  }
}