## Quick Start Guide: Complete the Migration

### Step 1: Set Up Your Database

Choose one of these options:

#### Option A: Local PostgreSQL (For Development)
```bash
# Install PostgreSQL from https://www.postgresql.org/download/

# Create database
createdb mvr_furniture

# Set your .env file
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/mvr_furniture"' > .env
```

#### Option B: Supabase (Recommended - Free Tier)
1. Go to https://supabase.com and create account
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection String" (URI format)
5. Create `.env` file with:
```
DATABASE_URL="your-connection-string-here"
```

#### Option C: Neon (Serverless PostgreSQL)
1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string
4. Add to `.env` file

### Step 2: Run Prisma Migration

```bash
# This creates all tables in your database
npx prisma migrate dev --name init

# If successful, you'll see:
# ✔ Generated Prisma Client
# ✔ Your database is now in sync with your schema
```

### Step 3: Optional - Seed Initial Data

If you want to start with sample data for testing:

```bash
# Create a seed file
npx prisma db seed
```

### Step 4: Start Your Application

```bash
npm run dev
```

Visit http://localhost:3000 and test:
- ✅ Products page
- ✅ Sales creation
- ✅ Expenditures
- ✅ Reports
- ✅ Dashboard

### Troubleshooting

#### Error: "Can't reach database server"
- Check your DATABASE_URL is correct
- Verify database server is running (if local)
- Check firewall/network settings

#### Error: "P1001: Can't reach database server"
- For cloud databases, ensure IP whitelist allows your connection
- Check SSL mode in connection string

#### Error: "relation does not exist"
- Run `npx prisma migrate dev` again
- Check that migration completed successfully

#### Need to reset database?
```bash
npx prisma migrate reset
```

### Migrating Existing Data from MongoDB

If you have existing MongoDB data, create a migration script:

```typescript
// scripts/migrate-data.ts
import { MongoClient } from 'mongodb';
import { prisma } from '../lib/prisma';

async function migrate() {
  const mongoClient = new MongoClient('mongodb://localhost:27017');
  await mongoClient.connect();
  const db = mongoClient.db('mvr_furniture');
  
  // Migrate Products
  const products = await db.collection('products').find().toArray();
  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        category: product.category,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        stock: product.stock,
        supplierName: product.supplierName,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  }
  
  // Continue for other collections...
  
  await mongoClient.close();
  await prisma.$disconnect();
}

migrate().catch(console.error);
```

Run with: `npx tsx scripts/migrate-data.ts`

### Verification Checklist

- [ ] Database connection successful
- [ ] All tables created (8 tables total)
- [ ] Can create a product
- [ ] Can create a sale
- [ ] Can view reports
- [ ] Dashboard loads correctly
- [ ] No console errors

### Need Help?

- [Prisma Discord](https://pris.ly/discord)
- [Prisma GitHub Discussions](https://github.com/prisma/prisma/discussions)
- Check MIGRATION_COMPLETE.md for detailed changes

---

**You're almost there! Just set up the database and run the migration. Good luck! 🚀**
