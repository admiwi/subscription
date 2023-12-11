# Part 1

This task had a bit of a different slant for me since I just left building what amounts to a subscription service for Delhivery. However, we had a specific micro-service called "subscription service" that solely handled the lifecycle of the subscription mechanism. I believe the ask was to build the entire backed end for what we had at Delhivery and not that specific service. 

## Architecture:
- Typescript 
    - Strong typing helps me find problems faster. I'm not a huge fan of the `async/await` pattern in Node because of the lack of support for dangling async functions. That said, static analysis tools are filling that gap.
- Monolith
  - For an early project, where you are still finding domain boundaries, I believe it is the best choice for development speed and ease of testing.
- NestJS Framework
  - The framework has the concept of modules which require you to declare imports and export. This requirement makes the developer more intentional about how resources are shared between components.
- Postgresql
  - RDBMS seemed like the best fit for the data to be stored. Aurora Postgresql is performant and scales quite large before you would need to do something dramatic. 
- Prisma ORM for database connectivity
  - I haven't used this before since I've been in the NoSQL world for too long, however, it worked out quite well and was pretty intuitive. That said, if something does go wrong, the error messages are pretty dense.  Previously, I've used TypeORM and didn't have a great time doing so.
  - I also used a plugin for encrypting PII. Had the plugin not existed, Prisma provides a relatively easy way of handling intercepting fields on models to encrypt and decrypt.
  - On the negative side, Prisma is fighting my mocks something fierce. 

## Assumptions and Trade Offs:
- The most notable assumption is a user (their email, more specifically), cannot subscribe to the same product multiple times. I did this to make the API between the front-end and the backend easier, allowing it to address specific subscriptions by `(email, product)` tuples.
- I chose a PostgreSQL instead of DynamoDB because this use case didn't specifically need NoSQL and relations exists between the models in the domain. All things given equal, RDBMS is gives us more tools, like transaction and relations, to reduce complexity in our code, or relying on another service, like Elasticsearch, to provide full-text search.


# Part 2

## Application Architecture
  As noted above, I chose to go with a monolith. More specifically, I would expect this to be a lambdalith---the app would be deployed to AWS Lambda, sitting behind an HTTP API Gateway. Beyond what was mentioned above, this would allow faster deployments and fewer cold starts. One draw back would potentially be longer cold starts, but it would probably be negligible and easily avoided using provisioned capacity or a warmer. The applications has four modules, each a different domain:
    - user: This is where nearly all the PII lives. It's the customers name, phone number, email address, and billing address. Phone number and the `addr1, addr2, addr3` fields are encrypted. 
    - product: This are the things that you buy. It's pretty simple, just an ID, called slug, a description and a sku. I went with a slug for an ID because I believe these should be identifiable visually. We shouldn't need to lookup or, worse, remember a UUID to know which product is showing up in logs and whatnot. This module has an endpoint to fetch all available products.
    - subscription: This is the meat of the app. See `src/subscription/subscription.controller.ts` for a list of the endpoints. Functionally, this module allows you to fetch subscriptions, create a new subscription, renew and cancel a subscription.  There are also to expiration endpoints. The first is `expirationReaper` this method scans for all subscriptions that should have expired and set them as such. The second is `expire(id)`. This would be used if each subscription had a specific schedule attached to it, such as a CloudWatch Scheduler entry. 
    - transaction: This module just writes what happens to subscriptions to a table. I would be used for displaying such data to a customer.
    Each module provides a way to fetch that domain's data. Using the prisma client, we could have does this directly in an module. That is to say, the subscription module could have looked up users by email using Prisma rather than invoking the `getByEmail` method on the user service. That would introduce what is essentially a database integration within the application... which is largely okay. However, being mindful of the domain boundaries early makes scaling or splitting the app up later much easier. For example, if the users were moved to a CRM, we have the interfaces that we need already defined. The strangler vine pattern for refactoring is half way done.

## Scalability and Performance
This application is likely providing data to a frontend so performance would be measured in latency.  The real performance tuning areas would be low query complexity, sufficient index coverage, avoiding cold starts, and right sized lambdas. 
- Choosing PostgreSQL, I would target AWS Aurora as the cloud based database. If database performance starts to suffer, I would remove the joins between user, product, and subscription that Prisma is doing. I would also be aware of any slow queries reported in CloudWatch and adjust indexes. If we cannot get the the performance out of Aurora that we want, I would reimplement the database layer in DynamoDB, potentially using DAX.  Aurora has a pretty substantial caching layer already, so adding redis wouldn't likely help.  
- Deploying the application as a lambda gives us a lot of tools to tune performance. If cold starts are a problem, we can use function warmers or provisioned concurrency to always have hot nodes ready to go. If it's not running fast enough, we can vertically scale the lambda provisioned memory. If latency is an issue, we could look into Lambda@Edge to get the code closer to the client. 
- The code itself is simple. There is one function, `expirationReaper`, which is doing things not in the best way. It would be nice to use an SQL `UPDATE` to set the subscriptions to expired, but then we lose the transaction logs. It is possible to use the PostgreSQL WAL to drive a CDC and that could drive the transaction log, which would be a nice enhancement since it would remove the transaction log from the developers responsibility.


## Security
Currently the system uses a [plugin](https://www.npmjs.com/package/prisma-field-encryption) for Prisma to enable the `@encrypted` comment annotation for Prisma schemas. See `/prisma/schema.prisma`. 
For general security of the service, I would require a valid token from a service account. This could be a JWT token from an authorizer in the API gateway chain. I would put guards on the endpoints to check the roles represented in the token to ensure the service account has the correct access to execute that function.

## State Management / Database Design
I chose PostgreSQL because the domain is relational and does not benefit from NoSQL type systems. At Delhivery, we built our subscription system in NoSQL and exceedingly difficult to keep all of the relations in sync especially in error conditions. 

I normalized the database schema so that nothing is repeated between tables. I vacillated on this a bit with address. I was tempted to denormalize the billing address and the shipToAddress, but I think it works out. Currently if a shipToAddress isn't provided, is uses the billingAddress ID for the subscription. I also added an unique index to `Subscription` so that you can find subscriptions by `userId` and `productId`. This makes the assumption that a user can only subscribe to a product once. 

## Error Handling
Since the system is three layers, that is, it is a controller->service->DB, error handling is being caught at the top level. If it is a database error, it will give a human readable message along with a 400. This could be expanded based on the different Prisma error codes to represent 400 or 500 based on the issue. Further, I would tune Prisma to use exponential backoff and retries for the Postgres connection to ensure we don't return errors for short, intermittent network issues.
For logging, I've added `nestjs-pino` which make NestJS log JSON and implements request logging. I would expect the logs to end up in CloudWatch and use CloudWatch alarms/SNS to alert on errors. I would use CloudWatch Insights to look through the logs. If that doesn't work out because of scale and volume, I would probably look to set up an ELK stack or use Datadog to fill this gap.

## Future Improvements
- I've mentioned a few things along the way, like using CDC (or DynamoStream, if we moved to DynamoDB for the DB) for transaction logs. 
- I would also introduce a separation between database entities and the application entities. I would fetch something from the database and translate it to a business object. This decoupling would allow the database schema, or provider, to change without affecting the contracts set forth in the API.
- I think the security enhancements would be first on my list, putting guards on the endpoints and requiring valid tokens. 
- CICD would be next, making the lambda do a blue/green or canary deployment. I would like build the IaC with CDK and GitHub actions as the starting off point. 
- React server side rendering could also be a sizable boon to speed up the frontend. 
