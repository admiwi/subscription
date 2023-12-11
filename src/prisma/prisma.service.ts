
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { fieldEncryptionExtension } from 'prisma-field-encryption'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    this.$extends(
      fieldEncryptionExtension()
    )
    await this.$connect();
  }
}
