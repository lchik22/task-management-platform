import { ApiProperty } from '@nestjs/swagger';
import {
  IsHexadecimal,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token from the emailed link',
    example: 'a'.repeat(64),
    minLength: 64,
    maxLength: 64,
  })
  @IsString()
  @IsHexadecimal()
  @Length(64, 64)
  token!: string;

  @ApiProperty({ example: 'S3cure!Pass', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;
}
