/**
 * Seed default categories. Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/scripts/seed-categories.ts
 * Or add to package.json: "seed": "tsx src/scripts/seed-categories.ts"
 */
import mongoose from 'mongoose';
import { Category } from '../models';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI required');
  process.exit(1);
}

const DEFAULT_CATEGORIES = [
  { name: 'News', slug: 'news' },
  { name: 'Events', slug: 'events' },
  { name: 'Community', slug: 'community' },
  { name: 'Business', slug: 'business' },
  { name: 'Lifestyle', slug: 'lifestyle' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, new: true }
    );
  }
  console.log('Categories seeded:', DEFAULT_CATEGORIES.map((c) => c.slug).join(', '));
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
