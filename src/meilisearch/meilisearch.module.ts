import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeiliSearchService } from './meilisearch.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MeiliSearchService],
  exports: [MeiliSearchService],
})
export class MeiliSearchModule {}
