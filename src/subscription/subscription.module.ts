import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionModule } from 'src/transaction/transaction.module';
import { UserModule } from 'src/user/user.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [
    TransactionModule,
    UserModule,
    ProductModule
  ],
  providers: [SubscriptionService, PrismaService],
  controllers: [SubscriptionController]
})
export class SubscriptionModule {}
