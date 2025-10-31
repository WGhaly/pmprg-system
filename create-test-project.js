const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestProject() {
  try {
    // Get project type and tier IDs
    const projectType = await prisma.projectType.findFirst({ where: { code: 'WEB' } });
    const tier = await prisma.tier.findFirst({ where: { tier: 1 } });
    
    if (!projectType || !tier) {
      console.error('Missing project type or tier');
      return;
    }

    // Create test project
    const project = await prisma.project.create({
      data: {
        code: 'TEST-ALLOC-001',
        name: 'Test Resource Allocation Project',
        description: 'A test project to demonstrate resource allocation functionality',
        projectTypeId: projectType.id,
        tierId: tier.id,
        status: 'DRAFT',
        targetStartDate: new Date('2024-12-01'),
        targetEndDate: new Date('2025-03-15'),
        actualStartDate: null,
        actualEndDate: null,
        estimatedBudget: 100000,
        actualBudget: null,
        requirementsGathering: 'HIGH',
        systemIntegration: 'MEDIUM',
        performanceTesting: 'HIGH',
        dataComplexity: 'HIGH',
        userStoryCount: 50,
        integrationCount: 5,
        performanceMetrics: 10,
        dataVolume: 'LARGE',
        stakeholderCount: 8,
        riskLevel: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Test project created:', project);
    return project;

  } catch (error) {
    console.error('Error creating test project:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProject();