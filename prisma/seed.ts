import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data in the correct order (respecting foreign key constraints)
  console.log('🧹 Clearing existing data...')
  await prisma.allocation.deleteMany()
  await prisma.projectBlock.deleteMany()
  await prisma.project.deleteMany()
  await prisma.resourceCalendarException.deleteMany()
  await prisma.resourceSkill.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.tierBlock.deleteMany()
  await prisma.block.deleteMany()
  await prisma.tier.deleteMany()
  await prisma.projectType.deleteMany()
  await prisma.skill.deleteMany()

  // Seed Project Types
  console.log('📁 Seeding Project Types...')
  await prisma.projectType.createMany({
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
  const dataType = await prisma.projectType.findFirst({ where: { code: 'DATA' } })
  const infraType = await prisma.projectType.findFirst({ where: { code: 'INFRA' } })

  // Seed Tiers
  console.log('📊 Seeding Tiers...')
  if (webType) {
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
      ],
    })
  }

  if (mobileType) {
    await prisma.tier.createMany({
      data: [
        {
          code: 'T1',
          name: 'Tier 1 - Small',
          description: 'Small mobile projects',
          sizeHint: '1-16 weeks, <$75k',
          projectTypeId: mobileType.id,
        },
        {
          code: 'T2',
          name: 'Tier 2 - Medium',
          description: 'Medium mobile projects',
          sizeHint: '12-24 weeks, <$150k',
          projectTypeId: mobileType.id,
        },
      ],
    })
  }

  if (dataType) {
    await prisma.tier.createMany({
      data: [
        {
          code: 'T1',
          name: 'Tier 1 - Small',
          description: 'Small data analytics projects',
          sizeHint: '4-12 weeks, <$40k',
          projectTypeId: dataType.id,
        },
      ],
    })
  }

  if (infraType) {
    await prisma.tier.createMany({
      data: [
        {
          code: 'T1',
          name: 'Tier 1 - Small',
          description: 'Small infrastructure projects',
          sizeHint: '2-8 weeks, <$30k',
          projectTypeId: infraType.id,
        },
      ],
    })
  }

  // Seed Skills
  console.log('🛠️ Seeding Skills...')
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
      { code: 'DB', name: 'Database Design', category: 'Technical' },
      { code: 'SEC', name: 'Security', category: 'Technical' },
      { code: 'ARCH', name: 'Architecture', category: 'Technical' },
      { code: 'MOBILE_DEV', name: 'Mobile Development', category: 'Technical' },
    ],
  })

  // Seed Blocks
  console.log('🧱 Seeding Blocks...')
  await prisma.block.createMany({
    data: [
      // Common blocks
      {
        code: 'PLANNING',
        name: 'Project Planning',
        description: 'Initial project planning and requirement gathering',
        defaultDurationWeeks: 2,
        defaultSkillsMix: JSON.stringify({ PM: 60, BA: 40 }),
      },
      {
        code: 'DESIGN',
        name: 'System Design',
        description: 'Technical and UI/UX design phase',
        defaultDurationWeeks: 3,
        defaultSkillsMix: JSON.stringify({ UX: 50, ARCH: 30, FE: 20 }),
      },
      {
        code: 'SETUP',
        name: 'Project Setup',
        description: 'Development environment and project structure setup',
        defaultDurationWeeks: 1,
        defaultSkillsMix: JSON.stringify({ OPS: 50, BE: 50 }),
      },
      // Web Development blocks
      {
        code: 'WEB_FRONTEND',
        name: 'Frontend Development',
        description: 'User interface development',
        defaultDurationWeeks: 4,
        defaultSkillsMix: JSON.stringify({ FE: 80, UX: 20 }),
      },
      {
        code: 'WEB_BACKEND',
        name: 'Backend Development',
        description: 'Server-side application development',
        defaultDurationWeeks: 5,
        defaultSkillsMix: JSON.stringify({ BE: 70, DB: 30 }),
      },
      {
        code: 'WEB_INTEGRATION',
        name: 'System Integration',
        description: 'Frontend and backend integration',
        defaultDurationWeeks: 2,
        defaultSkillsMix: JSON.stringify({ BE: 50, FE: 50 }),
      },
      // Mobile Development blocks
      {
        code: 'MOBILE_NATIVE',
        name: 'Native App Development',
        description: 'iOS and Android native development',
        defaultDurationWeeks: 6,
        defaultSkillsMix: JSON.stringify({ MOBILE_DEV: 80, UX: 20 }),
      },
      {
        code: 'MOBILE_API',
        name: 'Mobile API Development',
        description: 'Backend API for mobile apps',
        defaultDurationWeeks: 3,
        defaultSkillsMix: JSON.stringify({ BE: 80, SEC: 20 }),
      },
      // Testing and Deployment blocks
      {
        code: 'TESTING',
        name: 'Testing & QA',
        description: 'Comprehensive testing and quality assurance',
        defaultDurationWeeks: 2,
        defaultSkillsMix: JSON.stringify({ QA: 70, FE: 15, BE: 15 }),
      },
      {
        code: 'DEPLOYMENT',
        name: 'Deployment & Launch',
        description: 'Production deployment and go-live activities',
        defaultDurationWeeks: 1,
        defaultSkillsMix: JSON.stringify({ OPS: 60, BE: 40 }),
      },
      // Data Analytics blocks
      {
        code: 'DATA_COLLECTION',
        name: 'Data Collection Setup',
        description: 'Data pipeline and collection setup',
        defaultDurationWeeks: 2,
        defaultSkillsMix: JSON.stringify({ DA: 60, BE: 40 }),
      },
      {
        code: 'DATA_ANALYSIS',
        name: 'Data Analysis',
        description: 'Data exploration and analysis',
        defaultDurationWeeks: 4,
        defaultSkillsMix: JSON.stringify({ DA: 90, BA: 10 }),
      },
      // Infrastructure blocks
      {
        code: 'INFRA_SETUP',
        name: 'Infrastructure Setup',
        description: 'Cloud infrastructure provisioning',
        defaultDurationWeeks: 2,
        defaultSkillsMix: JSON.stringify({ OPS: 80, SEC: 20 }),
      },
      {
        code: 'INFRA_CONFIG',
        name: 'Configuration Management',
        description: 'System configuration and automation',
        defaultDurationWeeks: 3,
        defaultSkillsMix: JSON.stringify({ OPS: 100 }),
      },
    ],
  })

  // Get all tiers and blocks for TierBlock relationships
  const allTiers = await prisma.tier.findMany({ include: { projectType: true } })
  const allBlocks = await prisma.block.findMany()

  // Helper function to get block by code
  const getBlock = (code: string) => allBlocks.find(b => b.code === code)

  // Seed TierBlocks
  console.log('🔗 Seeding TierBlocks...')
  for (const tier of allTiers) {
    if (tier.projectType.code === 'WEB') {
      if (tier.code === 'T1') {
        // Web T1 - Small web projects
        await prisma.tierBlock.createMany({
          data: [
            { tierId: tier.id, blockId: getBlock('PLANNING')!.id, sequenceIndex: 1, overrideDurationWeeks: 1 },
            { tierId: tier.id, blockId: getBlock('DESIGN')!.id, sequenceIndex: 2, overrideDurationWeeks: 2 },
            { tierId: tier.id, blockId: getBlock('SETUP')!.id, sequenceIndex: 3, overrideDurationWeeks: 1 },
            { tierId: tier.id, blockId: getBlock('WEB_FRONTEND')!.id, sequenceIndex: 4, overrideDurationWeeks: 3 },
            { tierId: tier.id, blockId: getBlock('WEB_BACKEND')!.id, sequenceIndex: 5, overrideDurationWeeks: 3 },
            { tierId: tier.id, blockId: getBlock('WEB_INTEGRATION')!.id, sequenceIndex: 6, overrideDurationWeeks: 1 },
            { tierId: tier.id, blockId: getBlock('TESTING')!.id, sequenceIndex: 7, overrideDurationWeeks: 1 },
            { tierId: tier.id, blockId: getBlock('DEPLOYMENT')!.id, sequenceIndex: 8, overrideDurationWeeks: 1 },
          ],
        })
      } else if (tier.code === 'T2') {
        // Web T2 - Medium web projects
        await prisma.tierBlock.createMany({
          data: [
            { tierId: tier.id, blockId: getBlock('PLANNING')!.id, sequenceIndex: 1 },
            { tierId: tier.id, blockId: getBlock('DESIGN')!.id, sequenceIndex: 2 },
            { tierId: tier.id, blockId: getBlock('SETUP')!.id, sequenceIndex: 3 },
            { tierId: tier.id, blockId: getBlock('WEB_FRONTEND')!.id, sequenceIndex: 4 },
            { tierId: tier.id, blockId: getBlock('WEB_BACKEND')!.id, sequenceIndex: 5 },
            { tierId: tier.id, blockId: getBlock('WEB_INTEGRATION')!.id, sequenceIndex: 6 },
            { tierId: tier.id, blockId: getBlock('TESTING')!.id, sequenceIndex: 7 },
            { tierId: tier.id, blockId: getBlock('DEPLOYMENT')!.id, sequenceIndex: 8 },
          ],
        })
      }
    } else if (tier.projectType.code === 'MOBILE') {
      if (tier.code === 'T1') {
        // Mobile T1 - Small mobile projects
        await prisma.tierBlock.createMany({
          data: [
            { tierId: tier.id, blockId: getBlock('PLANNING')!.id, sequenceIndex: 1, overrideDurationWeeks: 1 },
            { tierId: tier.id, blockId: getBlock('DESIGN')!.id, sequenceIndex: 2, overrideDurationWeeks: 2 },
            { tierId: tier.id, blockId: getBlock('MOBILE_API')!.id, sequenceIndex: 3, overrideDurationWeeks: 2 },
            { tierId: tier.id, blockId: getBlock('MOBILE_NATIVE')!.id, sequenceIndex: 4, overrideDurationWeeks: 4 },
            { tierId: tier.id, blockId: getBlock('TESTING')!.id, sequenceIndex: 5, overrideDurationWeeks: 2 },
            { tierId: tier.id, blockId: getBlock('DEPLOYMENT')!.id, sequenceIndex: 6, overrideDurationWeeks: 1 },
          ],
        })
      } else if (tier.code === 'T2') {
        // Mobile T2 - Medium mobile projects
        await prisma.tierBlock.createMany({
          data: [
            { tierId: tier.id, blockId: getBlock('PLANNING')!.id, sequenceIndex: 1 },
            { tierId: tier.id, blockId: getBlock('DESIGN')!.id, sequenceIndex: 2 },
            { tierId: tier.id, blockId: getBlock('MOBILE_API')!.id, sequenceIndex: 3 },
            { tierId: tier.id, blockId: getBlock('MOBILE_NATIVE')!.id, sequenceIndex: 4 },
            { tierId: tier.id, blockId: getBlock('TESTING')!.id, sequenceIndex: 5 },
            { tierId: tier.id, blockId: getBlock('DEPLOYMENT')!.id, sequenceIndex: 6 },
          ],
        })
      }
    } else if (tier.projectType.code === 'DATA') {
      // Data Analytics T1
      await prisma.tierBlock.createMany({
        data: [
          { tierId: tier.id, blockId: getBlock('PLANNING')!.id, sequenceIndex: 1, overrideDurationWeeks: 1 },
          { tierId: tier.id, blockId: getBlock('DATA_COLLECTION')!.id, sequenceIndex: 2 },
          { tierId: tier.id, blockId: getBlock('DATA_ANALYSIS')!.id, sequenceIndex: 3, overrideDurationWeeks: 3 },
          { tierId: tier.id, blockId: getBlock('DEPLOYMENT')!.id, sequenceIndex: 4, overrideDurationWeeks: 1 },
        ],
      })
    } else if (tier.projectType.code === 'INFRA') {
      // Infrastructure T1
      await prisma.tierBlock.createMany({
        data: [
          { tierId: tier.id, blockId: getBlock('PLANNING')!.id, sequenceIndex: 1, overrideDurationWeeks: 1 },
          { tierId: tier.id, blockId: getBlock('INFRA_SETUP')!.id, sequenceIndex: 2 },
          { tierId: tier.id, blockId: getBlock('INFRA_CONFIG')!.id, sequenceIndex: 3, overrideDurationWeeks: 2 },
          { tierId: tier.id, blockId: getBlock('TESTING')!.id, sequenceIndex: 4, overrideDurationWeeks: 1 },
        ],
      })
    }
  }

  // Seed Resources
  console.log('👥 Seeding Resources...')
  await prisma.resource.createMany({
    data: [
      {
        employeeCode: 'EMP001',
        name: 'Sarah Johnson',
        employmentType: 'Full-time',
        homeTeam: 'Frontend Team',
        capacityHoursPerWeek: 40,
        monthlyRate: 8000,
        active: true,
      },
      {
        employeeCode: 'EMP002',
        name: 'Michael Chen',
        employmentType: 'Full-time',
        homeTeam: 'Backend Team',
        capacityHoursPerWeek: 40,
        monthlyRate: 8500,
        active: true,
      },
      {
        employeeCode: 'EMP003',
        name: 'Emma Wilson',
        employmentType: 'Full-time',
        homeTeam: 'Design Team',
        capacityHoursPerWeek: 40,
        monthlyRate: 7500,
        active: true,
      },
      {
        employeeCode: 'EMP004',
        name: 'James Rodriguez',
        employmentType: 'Full-time',
        homeTeam: 'Mobile Team',
        capacityHoursPerWeek: 40,
        monthlyRate: 9000,
        active: true,
      },
      {
        employeeCode: 'EMP005',
        name: 'Lisa Kim',
        employmentType: 'Full-time',
        homeTeam: 'QA Team',
        capacityHoursPerWeek: 40,
        monthlyRate: 7000,
        active: true,
      },
      {
        employeeCode: 'EMP006',
        name: 'David Thompson',
        employmentType: 'Full-time',
        homeTeam: 'DevOps Team',
        capacityHoursPerWeek: 40,
        monthlyRate: 8500,
        active: true,
      },
      {
        employeeCode: 'EMP007',
        name: 'Maria Garcia',
        employmentType: 'Part-time',
        homeTeam: 'Data Team',
        capacityHoursPerWeek: 20,
        monthlyRate: 4000,
        active: true,
      },
      {
        employeeCode: 'EMP008',
        name: 'Robert Lee',
        employmentType: 'Full-time',
        homeTeam: 'Management',
        capacityHoursPerWeek: 40,
        monthlyRate: 10000,
        active: true,
      },
    ],
  })

  // Seed Resource Skills
  console.log('🎯 Seeding Resource Skills...')
  const allResources = await prisma.resource.findMany()
  const allSkills = await prisma.skill.findMany()

  const getResource = (code: string) => allResources.find(r => r.employeeCode === code)
  const getSkill = (code: string) => allSkills.find(s => s.code === code)

  await prisma.resourceSkill.createMany({
    data: [
      // Sarah Johnson - Frontend Developer
      { resourceId: getResource('EMP001')!.id, skillId: getSkill('FE')!.id, level: 5 },
      { resourceId: getResource('EMP001')!.id, skillId: getSkill('UX')!.id, level: 3 },
      { resourceId: getResource('EMP001')!.id, skillId: getSkill('QA')!.id, level: 2 },
      
      // Michael Chen - Backend Developer
      { resourceId: getResource('EMP002')!.id, skillId: getSkill('BE')!.id, level: 5 },
      { resourceId: getResource('EMP002')!.id, skillId: getSkill('DB')!.id, level: 4 },
      { resourceId: getResource('EMP002')!.id, skillId: getSkill('ARCH')!.id, level: 4 },
      { resourceId: getResource('EMP002')!.id, skillId: getSkill('SEC')!.id, level: 3 },
      
      // Emma Wilson - UX Designer
      { resourceId: getResource('EMP003')!.id, skillId: getSkill('UX')!.id, level: 5 },
      { resourceId: getResource('EMP003')!.id, skillId: getSkill('FE')!.id, level: 2 },
      { resourceId: getResource('EMP003')!.id, skillId: getSkill('BA')!.id, level: 3 },
      
      // James Rodriguez - Mobile Developer
      { resourceId: getResource('EMP004')!.id, skillId: getSkill('MOBILE_DEV')!.id, level: 5 },
      { resourceId: getResource('EMP004')!.id, skillId: getSkill('BE')!.id, level: 3 },
      { resourceId: getResource('EMP004')!.id, skillId: getSkill('UX')!.id, level: 2 },
      
      // Lisa Kim - QA Engineer
      { resourceId: getResource('EMP005')!.id, skillId: getSkill('QA')!.id, level: 5 },
      { resourceId: getResource('EMP005')!.id, skillId: getSkill('FE')!.id, level: 3 },
      { resourceId: getResource('EMP005')!.id, skillId: getSkill('BE')!.id, level: 2 },
      
      // David Thompson - DevOps Engineer
      { resourceId: getResource('EMP006')!.id, skillId: getSkill('OPS')!.id, level: 5 },
      { resourceId: getResource('EMP006')!.id, skillId: getSkill('SEC')!.id, level: 4 },
      { resourceId: getResource('EMP006')!.id, skillId: getSkill('BE')!.id, level: 3 },
      
      // Maria Garcia - Data Analyst
      { resourceId: getResource('EMP007')!.id, skillId: getSkill('DA')!.id, level: 5 },
      { resourceId: getResource('EMP007')!.id, skillId: getSkill('DB')!.id, level: 3 },
      { resourceId: getResource('EMP007')!.id, skillId: getSkill('BA')!.id, level: 4 },
      
      // Robert Lee - Project Manager
      { resourceId: getResource('EMP008')!.id, skillId: getSkill('PM')!.id, level: 5 },
      { resourceId: getResource('EMP008')!.id, skillId: getSkill('BA')!.id, level: 4 },
      { resourceId: getResource('EMP008')!.id, skillId: getSkill('ARCH')!.id, level: 3 },
    ],
  })

  console.log('✅ Database seeded successfully with comprehensive master data!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })