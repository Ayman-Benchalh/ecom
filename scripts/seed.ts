import { seedDatabase } from "../src/lib/db/seed";

seedDatabase()
  .then(() => {
    console.log("Seed script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });

