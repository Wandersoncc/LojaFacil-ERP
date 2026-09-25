import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Popula os planos padrão (ver docs/01-PRD.md §7). */
async function main() {
  const plans = [
    { id: 'free', name: 'Gratuito', maxStores: 1, maxOrdersMo: 100, maxSkus: 50, maxUsers: 1, priceCents: 0 },
    { id: 'basic', name: 'Básico', maxStores: 3, maxOrdersMo: 1000, maxSkus: 1000, maxUsers: 2, priceCents: 4900 },
    { id: 'pro', name: 'Pro', maxStores: 5, maxOrdersMo: 5000, maxSkus: 1000000, maxUsers: 5, priceCents: 9900 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  // eslint-disable-next-line no-console
  console.log('Seed: planos criados/atualizados.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
