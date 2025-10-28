import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account with the specified role (defaults to free)',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          username: 'johndoe',
          role: 'free',
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.username,
      registerDto.password,
      registerDto.role,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticates user and returns JWT token with refresh token in HTTP-only cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          username: 'johndoe',
          role: 'free',
          subscription: null,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    response.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { refresh_token, ...data } = result;
    return data;
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Gets new access token using refresh token from cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refreshToken'];

    if (!refreshToken) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Refresh token not found' };
    }

    const decoded: any = this.authService['jwtService'].decode(refreshToken);
    const tokens = await this.authService.refreshTokens(
      decoded.sub,
      refreshToken,
    );

    response.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: tokens.access_token };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Clears refresh token cookie and invalidates tokens',
  })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = request.user as any;
    await this.authService.logout(user.userId);

    response.clearCookie('refreshToken');
    return { message: 'Successfully logged out' };
  }
}
