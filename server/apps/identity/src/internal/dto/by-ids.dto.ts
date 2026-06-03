import { IsArray, IsString } from 'class-validator';

export class ByIdsDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
