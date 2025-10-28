import { Injectable, UnauthorizedException, OnModuleInit  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  async createDefaultAdmin() {
    const adminEmail = this.configService.get<string>('DEFAULT_ADMIN_EMAIL');
    const adminUsername = this.configService.get<string>('DEFAULT_ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('DEFAULT_ADMIN_PASSWORD');

    if (!adminEmail || !adminUsername || !adminPassword) {
      console.log('⚠️  Default admin credentials not configured in .env');
      return;
    }

    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    
    if (!existingAdmin) {
      await this.usersService.create(
        adminEmail,
        adminUsername,
        adminPassword,
        UserRole.ADMIN,
      );
      console.log(`✅ Default admin created: ${adminEmail}`);
    } else {
      console.log('ℹ️  Default admin already exists');
    }
  }
  
  async register(
    email: string,
    username: string,
    password: string,
    role: UserRole = UserRole.FREE,
  ) {
    const user = await this.usersService.create(
      email,
      username,
      password,
      role,
    );
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role.name,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role.name,
        subscription: user.subscription,
      },
    };
  }
}
