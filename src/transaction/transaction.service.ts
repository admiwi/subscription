import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
    constructor(
        private prisma: PrismaService
    ) {}

    async writeTransaction(subscriptionId: string, transactionType: TransactionType, note = "") {
        await this.prisma.transaction.create({ data: {
            subscriptionId,
            transactionType,
            note
        }})
    }
}
