import Link from 'next/link';
import { Building2, Users, Calendar, DollarSign, BarChart3, Settings } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">PMPRG</h1>
              <span className="ml-2 text-sm text-gray-500">v1.0.0</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/master-data" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Master Data
              </Link>
              <Link href="/projects" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Projects
              </Link>
              <Link href="/resources" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Resources
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <div className="ml-6 border-l border-gray-300 pl-6">
                <UserMenu />
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to PMPRG
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Project Management & Resource Planning System for Progressio Solutions
              </p>
              <p className="text-gray-600">
                Manage your projects, resources, and budgets in one comprehensive platform. 
                From national-scale innovation programs to internal R&D development.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Master Data Management */}
            <Link href="/master-data" className="group">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Settings className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                        Master Data
                      </h4>
                      <p className="text-sm text-gray-500">
                        Manage project types, tiers, blocks, and skills
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Project Management */}
            <Link href="/projects" className="group">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Building2 className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                        Projects
                      </h4>
                      <p className="text-sm text-gray-500">
                        Create and manage projects with auto-planning
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Resource Management */}
            <Link href="/resources" className="group">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                        Resources
                      </h4>
                      <p className="text-sm text-gray-500">
                        Allocate and track resource utilization
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Schedule Management */}
            <Link href="/schedule" className="group">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                        Schedule
                      </h4>
                      <p className="text-sm text-gray-500">
                        View timeline and Gantt charts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Budget Tracking */}
            <Link href="/budget" className="group">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                        Budget
                      </h4>
                      <p className="text-sm text-gray-500">
                        Track costs and budget variance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Dashboard & Analytics */}
            <Link href="/dashboard" className="group">
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                        Dashboard
                      </h4>
                      <p className="text-sm text-gray-500">
                        View KPIs and performance metrics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* System Status */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-green-800">Database Connected</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-blue-400 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-blue-800">API Services Online</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-purple-400 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-purple-800">Monitoring Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}