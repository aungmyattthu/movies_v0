import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, UserRole } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const roles = [
      { name: UserRole.ADMIN, description: 'Administrator with full access' },
      {
        name: UserRole.PREMIUM,
        description: 'Premium user with full movie access',
      },
      {
        name: UserRole.FREE,
        description: 'Free user with trailer access only',
      },
    ];

    for (const roleData of roles) {
      const exists = await this.rolesRepository.findOne({
        where: { name: roleData.name },
      });
      if (!exists) {
        const role = this.rolesRepository.create(roleData);
        await this.rolesRepository.save(role);
      }
    }
  }

  async findByName(name: UserRole): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }
}
