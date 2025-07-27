import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeepinfraService } from './deepinfra.service';
import { DeepinfraController } from './deepinfra.controller';

@Module({
  imports: [ConfigModule],
  providers: [DeepinfraService],
  exports: [DeepinfraService],
  controllers: [DeepinfraController],
})
export class DeepinfraModule {}
