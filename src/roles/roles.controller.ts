import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './entities/role.entity';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all roles',
    description: 'Returns list of all available user roles',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of roles retrieved successfully',
    schema: {
      example: [
        { id: 'uuid', name: 'admin', description: 'Administrator with full access' },
        { id: 'uuid', name: 'premium', description: 'Premium user with full movie access' },
        { id: 'uuid', name: 'free', description: 'Free user with trailer access only' },
      ],
    },
  })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get('admin-only')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Admin only endpoint (Example)',
    description: 'Example of a protected endpoint accessible only by admins',
  })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async adminOnlyEndpoint() {
    return {
      message: 'This endpoint is only accessible by admins',
      roles: await this.rolesService.findAll(),
    };
  }
}