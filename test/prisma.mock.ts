import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

import { PrismaService } from 'src/prisma/prisma.service'

jest.mock('src/prisma/prisma.service', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

export const PrismaServiceMock = PrismaService as unknown as DeepMockProxy<PrismaClient>
