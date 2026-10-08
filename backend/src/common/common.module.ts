import { Global, Module } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';
import { SupabaseStorageService } from './services/supabase-storage.service';
import { GoogleAuthService } from './services/google-auth.service';
import { EmailService } from './services/email.service';

@Global()
@Module({
  providers: [TurnstileService, SupabaseStorageService, GoogleAuthService, EmailService],
  exports: [TurnstileService, SupabaseStorageService, GoogleAuthService, EmailService],
})
export class CommonModule {}
