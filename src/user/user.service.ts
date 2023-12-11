import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {

    constructor(
        private prisma: PrismaService
    ) {}

    async getById(id: string) {
        return this.prisma.user.findUniqueOrThrow({ where: { id }});
    }

    async getByEmail(email: string) {
        return this.prisma.user.findUniqueOrThrow({ where: { email }});
    }

    async get(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, cursor, where, orderBy } = params;
        return await this.prisma.user.findMany({
          skip,
          take,
          cursor,
          where,
          orderBy,
        });
    }
}
