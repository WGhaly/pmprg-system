import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Project Types
  const projectTypes = await prisma.projectType.createMany({
    data: [
      {
        code: 'WEB',
        name: 'Web Development',
        description: 'Custom web application development projects',
        active: true,
      },
      {
        code: 'MOBILE',
        name: 'Mobile App',
        description: 'iOS and Android mobile application development',
        active: true,
      },
      {
        code: 'DATA',
        name: 'Data Analytics',
        description: 'Business intelligence and data analysis projects',
        active: true,
      },
      {
        code: 'INFRA',
        name: 'Infrastructure',
        description: 'IT infrastructure and DevOps projects',
        active: true,
      },
    ],
  })

  // Get project types for tier creation
  const webType = await prisma.projectType.findFirst({ where: { code: 'WEB' } })
  const mobileType = await prisma.projectType.findFirst({ where: { code: 'MOBILE' } })

  if (webType && mobileType) {
    // Seed Tiers
    await prisma.tier.createMany({
      data: [
        {
          code: 'T1',
          name: 'Tier 1 - Small',
          description: 'Small projects under 500 hours',
          sizeHint: '1-12 weeks, <$50k',
          projectTypeId: webType.id,
        },
        {
          code: 'T2',
          name: 'Tier 2 - Medium',
          description: 'Medium projects 500-2000 hours',
          sizeHint: '8-32 weeks, <$200k',
          projectTypeId: webType.id,
        },
        {
          code: 'T1',
          name: 'Tier 1 - Small',
          description: 'Small mobile projects',
          sizeHint: '1-16 weeks, <$75k',
          projectTypeId: mobileType.id,
        },
      ],
    })
  }

  // Seed Skills
  await prisma.skill.createMany({
    data: [
      { code: 'FE', name: 'Frontend Development', category: 'Technical' },
      { code: 'BE', name: 'Backend Development', category: 'Technical' },
      { code: 'UX', name: 'UI/UX Design', category: 'Design' },
      { code: 'PM', name: 'Project Management', category: 'Management' },
      { code: 'DA', name: 'Data Analysis', category: 'Analytics' },
      { code: 'OPS', name: 'DevOps', category: 'Technical' },
      { code: 'QA', name: 'Quality Assurance', category: 'Testing' },
      { code: 'BA', name: 'Business Analysis', category: 'Analysis' },
    ],
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })