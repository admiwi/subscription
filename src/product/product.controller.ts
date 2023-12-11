import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {

    constructor(private productSvc: ProductService) {

    }

    @Get()
    async getProducts() {
        return await this.productSvc.get({})
    }


}
