import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Put } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionDTO, SubscriptionIdDTO } from 'src/common.interfaces';
import { Prisma } from '@prisma/client';

@Controller('subscription')
export class SubscriptionController {
    logger = new Logger(this.constructor.name);
    constructor(private subscriptionSvc: SubscriptionService) { }

    @Get()
    async getSubscriptions() {
        return await this.subscriptionSvc.get({})
    }

    @Post()
    async createSubscription(@Body() sub: SubscriptionDTO) {
        try {
            return await this.subscriptionSvc.create(sub);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                this.logger.warn(`DB error ${err.code}: ${err.message}`, sub);
                throw new BadRequestException(err.message);
            }
            throw err;
        }

    }

    @Post("/cancel")
    async cancelSubscription(@Body() subscriptionId: SubscriptionIdDTO) {
        try {
            return await this.subscriptionSvc.cancel(subscriptionId.userEmail, subscriptionId.product);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                this.logger.warn(`DB error ${err.code}: ${err.message}`, subscriptionId);
                throw new BadRequestException(err.message);
            }
            throw err;
        }
    }

    @Post("/renew")
    async renewSubscription(@Body() subscriptionId: SubscriptionIdDTO) {
        try {
            return await this.subscriptionSvc.renew(subscriptionId.userEmail, subscriptionId.product);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                this.logger.warn(`DB error ${err.code}: ${err.message}`, subscriptionId);
                throw new BadRequestException(err.message);
            }
            throw err;
        }
    }

    @Post("/expire")
    async expireAll() {
        try {
            return await this.subscriptionSvc.expirationReaper();
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                this.logger.warn(`DB error ${err.code}: ${err.message}`);
                throw new BadRequestException(err.message);
            }
            throw err;
        }
    }

    @Post("/expire/:id")
    async expire(@Param("id") id: string) {
        try {

            return await this.subscriptionSvc.expire(id);
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                this.logger.warn(`DB error ${err.code}: ${err.message}`, id);
                throw new BadRequestException(err.message);
            }
            throw err;
        }
    }

}
