import { Global, Module } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';
import { SupabaseStorageService } from './services/supabase-storage.service';

@Global()
@Module({
  providers: [TurnstileService, SupabaseStorageService],
  exports: [TurnstileService, SupabaseStorageService],
})
export class CommonModule {}
