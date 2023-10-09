import { Module } from '@nestjs/common';
import { ProfileGateway } from './profile.gateway';
import { ConnectionModule } from 'src/connection/connection.module';

@Module({
  imports: [ConnectionModule],
  providers: [ProfileGateway]
})
export class ProfileModule {}
