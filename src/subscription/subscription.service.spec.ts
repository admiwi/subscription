import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductService } from 'src/product/product.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserService } from 'src/user/user.service';
import { SubscriptionState, SubscriptionTerms, TransactionType } from '@prisma/client';
import { SubscriptionDTO, SubscriptionIdDTO } from 'src/common.interfaces';


describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let prisma, userService, productService, transactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, SubscriptionService, UserService, TransactionService, ProductService],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    prisma = {
      subscription: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: undefined
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: undefined
      },
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: undefined
      },
      tranaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: undefined
      },
      address: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: undefined
      },
    }
    userService = {
     getByEmail: jest.fn(),
   };
    productService = {
     getBySlug: jest.fn(),
   };
    transactionService = {
     writeTransaction: jest.fn(),
   };
  });

  it('should be defined', () => {
    expect(subscriptionService).toBeDefined();
  });

  describe('SubscriptionService - get', () => {  
    it('should call prisma.subscription.findMany with correct params', async () => {
      await subscriptionService.get({});
      expect(prisma.subscription.findMany).toHaveBeenCalledWith({include: { shipToAddress: true, user: true, product: true } });
    });
  
    it('should return the results of prisma.subscription.findMany', async () => {
      const mockSubscriptions = [{}, {}];
      prisma.subscription.findMany.mockReturnValue(Promise.resolve(mockSubscriptions));
      const params = {};
      const subscriptions = await subscriptionService.get(params);
      expect(subscriptions).toEqual(mockSubscriptions);
    });
  });

  describe('SubscriptionService - create', () => {
    it('should call userService.getByEmail and productService.getBySlug', async () => {
      const subscriptionDTO: SubscriptionDTO = {
        userEmail: 'test@example.com',
        product: 'product-slug',
        terms: SubscriptionTerms.MONTHLY,
      };
  
      await subscriptionService.create(subscriptionDTO);
  
      expect(userService.getByEmail).toHaveBeenCalledWith('test@example.com');
      expect(productService.getBySlug).toHaveBeenCalledWith('product-slug');
    });
  
    it('should call prisma.subscription.create with correct data', async () => {
      const mockUser = { id: 'user-id', billingAddressId: 'billing-address-id' };
      const mockProduct = { slug: 'product-slug' };
      userService.getByEmail.mockReturnValue(Promise.resolve(mockUser));
      productService.getBySlug.mockReturnValue(Promise.resolve(mockProduct));
      const subscriptionDTO: SubscriptionDTO = {
        userEmail: 'test@example.com',
        product: 'product-slug',
        terms: SubscriptionTerms.MONTHLY,
      };
  
      await subscriptionService.create(subscriptionDTO);
  
      const expectedData = {
        userId: 'user-id',
        productId: 'product-slug',
        expiresAt: expect.any(Date),
        state: SubscriptionState.ACTIVE,
        terms: SubscriptionTerms.MONTHLY,
        shipToAddressId: 'billing-address-id',
      };
      expect(prisma.subscription.create).toHaveBeenCalledWith({ data: expectedData });
    });
  
    it('should call transactionService.writeTransaction with correct params', async () => {
      const mockSubscription = { id: 'subscription-id' };
      prisma.subscription.create.mockReturnValue(Promise.resolve(mockSubscription));
      const subscriptionDTO: SubscriptionDTO = {
        userEmail: 'test@example.com',
        product: 'product-slug',
        terms: SubscriptionTerms.MONTHLY,
      };
  
      await subscriptionService.create(subscriptionDTO);
  
      expect(transactionService.writeTransaction).toHaveBeenCalledWith('subscription-id', TransactionType.CREATE);
    });
  });

  describe('SubscriptionService - renew', () => {
    it('should call userService.getByEmail and prisma.subscription.findUniqueOrThrow', async () => {
      const email = 'test@example.com';
      const product = 'product-slug';
      await subscriptionService.renew(email, product);
      expect(userService.getByEmail).toHaveBeenCalledWith(email);
      expect(prisma.subscription.findUniqueOrThrow).toHaveBeenCalledWith({ where: { userId_productId: { userId: expect.any(String), productId: product } } });
    });
  
    it('should call prisma.subscription.update with correct data', async () => {
      const subscriptionIdDTO: SubscriptionIdDTO = { userEmail: 'test@example.com', product: "product-slug" };
      const mockSubscription = { id: 'subscription-id', expiresAt: new Date() };
      userService.getByEmail.mockReturnValue(Promise.resolve(subscriptionIdDTO));
      prisma.subscription.findUniqueOrThrow.mockReturnValue(Promise.resolve(mockSubscription));
      
      await subscriptionService.renew(subscriptionIdDTO.userEmail, subscriptionIdDTO.product);
      
      const expectedData = { expiresAt: expect.any(Date), state: SubscriptionState.ACTIVE };
      expect(prisma.subscription.update).toHaveBeenCalledWith({ where: { id: mockSubscription.id }, data: expectedData });
    });
  
    it('should call transactionService.writeTransaction with correct params', async () => {
      const mockSubscription = { id: 'subscription-id' };
      prisma.subscription.findUniqueOrThrow.mockReturnValue(Promise.resolve(mockSubscription));
      
      await subscriptionService.renew('user@example.com', 'product-slug');
      
      expect(transactionService.writeTransaction).toHaveBeenCalledWith(mockSubscription.id, TransactionType.RENEW);
    });
  });

  describe('SubscriptionService - expirationReaper', () => {
  
    it('should update each expired subscription to `EXPIRED` state', async () => {
      const mockExpiredSubscriptions = [{ id: 'sub1' }, { id: 'sub2' }];
      prisma.subscription.findMany.mockReturnValue(Promise.resolve(mockExpiredSubscriptions));
      
      await subscriptionService.expirationReaper();
      
      const expectedData = { state: SubscriptionState.EXPIRED };
      expect(prisma.subscription.update).toHaveBeenCalledTimes(mockExpiredSubscriptions.length);
      expect(prisma.subscription.update).toHaveBeenCalledWith({ where: { id: 'sub1' }, data: expectedData });
      expect(prisma.subscription.update).toHaveBeenCalledWith({ where: { id: 'sub2' }, data: expectedData });
    });
  })
  
    
    describe('SubscriptionService - nextExpirationDate', () => {
      it('should calculate next expiration date for monthly terms', () => {
        const params = { terms: SubscriptionTerms.MONTHLY, expiresAt: new Date('2023-10-20T01:00:00.000Z') };
        const nextExpirationDate = subscriptionService.nextEpirationDate(params);
        expect(nextExpirationDate.toISOString()).toBe('2023-11-20T02:00:00.000Z');
      });
    
      it('should calculate next expiration date for yearly terms', () => {
        const params = { terms: SubscriptionTerms.YEARLY, expiresAt: new Date('2023-10-20T01:00:00.000Z') };
        const nextExpirationDate = subscriptionService.nextEpirationDate(params);
        expect(nextExpirationDate.toISOString()).toBe('2024-10-20T01:00:00.000Z');
      });
    });
  });