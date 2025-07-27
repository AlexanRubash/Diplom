import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDeepInfra } from '@ai-sdk/deepinfra';
import { generateText } from "ai";

@Injectable()
export class DeepinfraService {
  private client: any; // Тип для DeepInfra

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPINFRA_API_KEY');

    if (!apiKey) {
      throw new Error('DEEPINFRA_API_KEY is not configured.');
    }

    this.client = createDeepInfra({
      apiKey,
    });
  }

  // Метод для перевода текста на указанный язык с пояснением
  public async translateText(
    task: string,
    translate: string,
    targetLanguage: string,
  ): Promise<any> {
    try {
      const language = targetLanguage === 'es' ? 'испанский' : 'русский';
      const input = `Объясни, почему перевод предложения c ${language} правильный.\nПредложение: "${task}"\nПеревод: "${translate}"\nПояснение:`;

      // Отправляем запрос для генерации текста с объяснением
      const { text } = await generateText({
        model: this.client('Qwen/Qwen2-72B-Instruct'), // Используем новую модель
        prompt: input,
      });

      // Возвращаем результат перевода и пояснение
      return {
        explanation: text, // Текст пояснения
        translatedText: translate, // Вернули переведенный текст для контекста
      };
    } catch (error) {
      console.error('Ошибка при запросе к Deepinfra API:', error);
      throw error;
    }
  }
}
