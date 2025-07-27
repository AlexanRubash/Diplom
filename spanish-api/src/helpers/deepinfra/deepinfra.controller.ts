import { Controller, Post, Body } from '@nestjs/common';
import { DeepinfraService } from './deepinfra.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('deepinfra')
@Controller('deepinfra')
export class DeepinfraController {
  constructor(private readonly deepinfraService: DeepinfraService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Translate text based on input data.' })
  @Post('translate')
  public async translateText(
    @Body('task') task: string, // текст для перевода
    @Body('translate') translate: string, // переведенный текст
    @Body('targetLanguage') targetLanguage: string, // целевой язык
  ): Promise<any> {
    if (!task || !targetLanguage) {
      throw new Error('Input text and target language are required.');
    }
    return this.deepinfraService.translateText(task, translate, targetLanguage);
  }
}
