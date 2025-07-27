import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class CreateWordDto {
  @ApiProperty()
  description: string | null;
  @ApiProperty()
  @Matches(/^.{1,50}$/)
  transcription: string;
  @ApiProperty()
  @Matches(/^[a-záéíóúüñ\s-]{1,30}$/i)
  englishSpelling: string;
  @ApiProperty()
  @Matches(/^[а-я\s-]{1,30}$/)
  russianSpelling: string;
}
