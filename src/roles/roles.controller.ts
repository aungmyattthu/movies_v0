import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './entities/role.entity';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // Public endpoint - Get all available roles
  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  // Admin only - View roles (example of protected endpoint)
  @Get('admin-only')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminOnlyEndpoint() {
    return {
      message: 'This endpoint is only accessible by admins',
      roles: await this.rolesService.findAll(),
    };
  }
}