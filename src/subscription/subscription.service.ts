import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SubscriptionState, SubscriptionTerms, TransactionType } from '@prisma/client';
import { DateTime } from 'luxon';
import { UserService } from 'src/user/user.service';
import { ProductService } from 'src/product/product.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { SubscriptionDTO } from 'src/common.interfaces';

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(this.constructor.name);
    constructor(
        private prisma: PrismaService,
        private userService: UserService,
        private productService: ProductService,
        private transactionService: TransactionService) { }

    async get(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.SubscriptionWhereUniqueInput;
        where?: Prisma.SubscriptionWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, cursor, where, orderBy } = params;
        return await this.prisma.subscription.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                shipToAddress: true,
                user: true,
                product: true,
            }
        });
    }

    async create(params: SubscriptionDTO) {
        const product = await this.productService.getBySlug(params.product);
        const user = await this.userService.getByEmail(params.userEmail);
        const terms =  params.terms ? SubscriptionTerms[params.terms] : SubscriptionTerms.MONTHLY
        const newSubscription = {
            userId: user.id,
            productId: product.slug,
            expiresAt: this.nextEpirationDate({terms, expiresAt: new Date()}),
            state: SubscriptionState.ACTIVE,
            terms,
        }
        if (params.shipToAddress) {
            newSubscription['shipToAddress'] = { create: { ...params.shipToAddress } };
        } else {
            newSubscription['shipToAddressId'] = user.billingAddressId;
        }
        const sub = await this.prisma.subscription.create({ data: newSubscription })
        await this.transactionService.writeTransaction(sub.id, TransactionType.CREATE);

        return sub;
    }

    async renew(email: string, product: string) {
        const user = await this.userService.getByEmail(email);
        const subscription = await this.prisma.subscription.findUniqueOrThrow({ where: { userId_productId: { userId: user.id, productId: product } } });
        const expiresAt = this.nextEpirationDate(subscription);
        await this.transactionService.writeTransaction(subscription.id, TransactionType.RENEW);
        return await this.prisma.subscription.update({ data: { expiresAt }, where: { id: subscription.id } });
    }

    async cancel(email: string, product: string) {
        const user = await this.userService.getByEmail(email);
        const subscription = await this.prisma.subscription.findUniqueOrThrow({ where: { userId_productId: { userId: user.id, productId: product } } });
        const expiresAt = this.nextEpirationDate(subscription);
        await this.transactionService.writeTransaction(subscription.id, TransactionType.CANCEL);
        return await this.prisma.subscription.update({ data: { state: SubscriptionState.CANCELED }, where: { id: subscription.id } });
    }

    async expirationReaper() {
        const expiredSubs = await this.prisma.subscription.findMany({where: { expiresAt: { lte: new Date() }, state: SubscriptionState.ACTIVE }})
        Promise.all(expiredSubs.map(async sub=>{
            const expiredSub = await this.prisma.subscription.update({
                where: { id: sub.id, state: SubscriptionState.ACTIVE },
                data: { state: SubscriptionState.EXPIRED }
            });
            if(expiredSub) {
                await this.transactionService.writeTransaction(sub.id, TransactionType.EXPIRE);
            }
        }));
    }

    async expire(id: string) {
        await this.prisma.subscription.findUniqueOrThrow({ where: { id } });
        const expiredSub = await this.prisma.subscription.update({
            where: { id, state: SubscriptionState.ACTIVE },
            data: { state: SubscriptionState.EXPIRED }
        })
        await this.transactionService.writeTransaction(id, TransactionType.EXPIRE);
        return expiredSub;
    }

    nextEpirationDate(params: {terms: SubscriptionTerms, expiresAt: Date}): Date {
        const expire = DateTime.fromJSDate(params.expiresAt);
        let newExpire;
        switch (params.terms) {
            case SubscriptionTerms.MONTHLY:
                newExpire = expire.plus({ month: 1 }).toJSDate(); break;
            case SubscriptionTerms.YEARLY:
                newExpire = expire.plus({ year: 1 }).toJSDate(); break;
            default:
                this.logger.warn('terms not set for subsciption, defaulting to monthly')
                newExpire = expire.plus({ month: 1 }).toJSDate();
        }
        this.logger.log("expires", {params, newExpire})
        return newExpire;
    }
}
