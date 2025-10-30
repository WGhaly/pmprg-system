'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { CreateProjectWizardInput } from '@/lib/validations/projects';
import { DollarSign, TrendingUp, Building, Info } from 'lucide-react';

interface BudgetStepProps {
  register: UseFormRegister<CreateProjectWizardInput>;
  errors: FieldErrors<CreateProjectWizardInput>;
  watch: UseFormWatch<CreateProjectWizardInput>;
}

export default function BudgetStep({ register, errors, watch }: BudgetStepProps) {
  const budgetCapex = watch('budgetCapex');
  const budgetOpex = watch('budgetOpex');

  const totalBudget = (budgetCapex || 0) + (budgetOpex || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <DollarSign className="mx-auto h-12 w-12 text-primary-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Budget Planning</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set the financial parameters for your project (optional)
        </p>
      </div>

      <div className="space-y-6">
        {/* Budget Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Budget Categories</h4>
              <div className="mt-1 text-sm text-blue-700">
                <p><strong>CAPEX (Capital Expenditure):</strong> One-time costs for assets, equipment, or infrastructure that provide long-term value.</p>
                <p className="mt-1"><strong>OPEX (Operating Expenditure):</strong> Recurring costs for day-to-day operations, salaries, and ongoing expenses.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CAPEX Budget */}
        <div>
          <label htmlFor="budgetCapex" className="label">
            <Building className="inline h-4 w-4 mr-1" />
            CAPEX Budget
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="budgetCapex"
              type="number"
              min="0"
              step="1000"
              {...register('budgetCapex', { valueAsNumber: true })}
              className={`input-field pl-10 ${errors.budgetCapex ? 'border-red-300' : ''}`}
              placeholder="0"
              data-testid="budget-capex"
            />
          </div>
          {errors.budgetCapex && (
            <p className="mt-1 text-sm text-red-600" data-testid="budget-capex-error">
              {errors.budgetCapex.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Capital expenditure for equipment, infrastructure, or long-term assets
          </p>
        </div>

        {/* OPEX Budget */}
        <div>
          <label htmlFor="budgetOpex" className="label">
            <TrendingUp className="inline h-4 w-4 mr-1" />
            OPEX Budget
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="budgetOpex"
              type="number"
              min="0"
              step="1000"
              {...register('budgetOpex', { valueAsNumber: true })}
              className={`input-field pl-10 ${errors.budgetOpex ? 'border-red-300' : ''}`}
              placeholder="0"
              data-testid="budget-opex"
            />
          </div>
          {errors.budgetOpex && (
            <p className="mt-1 text-sm text-red-600" data-testid="budget-opex-error">
              {errors.budgetOpex.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Operating expenditure for salaries, ongoing costs, and recurring expenses
          </p>
        </div>

        {/* Budget Summary */}
        {totalBudget > 0 && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Budget Summary</h4>
            <div className="space-y-2">
              {budgetCapex && budgetCapex > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CAPEX:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(budgetCapex)}
                  </span>
                </div>
              )}
              {budgetOpex && budgetOpex > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">OPEX:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(budgetOpex)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Total Budget:</span>
                  <span className="text-lg font-semibold text-primary-600">
                    {formatCurrency(totalBudget)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Budget Message */}
        {totalBudget === 0 && (
          <div className="text-center py-6">
            <DollarSign className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No budget specified. You can add budget information later if needed.
            </p>
          </div>
        )}

        {/* Budget Guidelines */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <Info className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Budget Guidelines</h4>
              <div className="mt-1 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Budget information is optional and can be updated later</li>
                  <li>These budgets will be used for project reporting and tracking</li>
                  <li>Actual costs will be tracked against these budgets during project execution</li>
                  <li>Consider including contingency in your budget estimates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}