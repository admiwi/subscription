import { PrismaClient } from '@prisma/client'
import { fieldEncryptionExtension } from 'prisma-field-encryption'
require('dotenv').config()

const prisma = new PrismaClient()
prisma.$extends(fieldEncryptionExtension())

async function main() {
  const jane = await prisma.user.upsert({
    where: { email: 'foo@example.com' },
    update: {},
    create: {
      email: 'foo@example.com',
      fname: 'Jane',
      lname: "Lynch",
      phone: "518-555-1212",
      billingAddress: {
        create: {
            addr1: "123 Mountain Town Rd",
            state: "NY",
            city: "Hudson",
            postalCode: "12345",
            country: "USA",
        }
      }
    },
  })
  const widget = await prisma.product.upsert({
    where: { slug: 'widget_1' },
    update: {},
    create: {
      sku: '12345',
      slug: "widget_1",
      description: "The Widget to Rule Them All"      
    },
  })
  console.log({ jane, widget })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
