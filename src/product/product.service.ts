import { Injectable } from '@nestjs/common';
import { Prisma, ProductState } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
    constructor(
        private prisma: PrismaService
    ) {}

    async getBySlug(slug: string) {
        return this.prisma.product.findUniqueOrThrow({ where: { slug }});
    }

    async get(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ProductWhereUniqueInput;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }) {
        const { skip, take, cursor, where, orderBy } = params;
        return await this.prisma.product.findMany({
          skip,
          take,
          cursor,
          where: where ? where : { state: ProductState.GA },
          orderBy,
        });
    }
}
