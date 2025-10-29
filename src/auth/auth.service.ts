import {
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

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
    const adminUsername = this.configService.get<string>(
      'DEFAULT_ADMIN_USERNAME',
    );
    const adminPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
    );

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

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
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

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role.name,
        subscription: user.subscription,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.update(userId, { refreshToken: null });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }
}
