import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'test@x.com',
    description: 'Unique user email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'pass1234',
    minLength: 6,
    description: 'User password (min 6 chars)',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'test@x.com',
    description: 'Previously registered email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'pass1234',
    minLength: 6,
    description: 'Password for the registered account',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
