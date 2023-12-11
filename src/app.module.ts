import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SubscriptionModule } from './subscription/subscription.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { TransactionModule } from './transaction/transaction.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [SubscriptionModule, UserModule, ProductModule, TransactionModule, LoggerModule.forRoot()],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
