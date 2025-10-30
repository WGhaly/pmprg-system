'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Skill {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface ResourceSkill {
  skillId: string;
  skillCode?: string;
  skillName?: string;
  skillCategory?: string;
  level: number;
}

interface Resource {
  id: string;
  name: string;
  employeeCode: string;
  homeTeam: string;
  employmentType: string;
  monthlyRate: number;
  capacityHoursPerWeek: number;
  availabilityCalendar?: string;
  active: boolean;
  skills?: ResourceSkill[];
}

interface ResourceFormProps {
  resource?: Resource | null;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  employeeCode: string;
  homeTeam: string;
  employmentType: string;
  monthlyRate: number;
  capacityHoursPerWeek: number;
  availabilityCalendar: string;
  skills: ResourceSkill[];
}

export default function ResourceForm({ resource, onSave, onCancel }: ResourceFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    employeeCode: '',
    homeTeam: '',
    employmentType: 'FTE',
    monthlyRate: 0,
    capacityHoursPerWeek: 40,
    availabilityCalendar: '',
    skills: [],
  });

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Toast hook for notifications
  const { toast, promiseToast } = useToast();

  // Employment type options
  const employmentTypes = [
    { value: 'FTE', label: 'Full-Time Employee' },
    { value: 'Contractor', label: 'Contractor' },
    { value: 'Consultant', label: 'Consultant' },
    { value: 'Intern', label: 'Intern' },
  ];

  // Load available skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/skills');
        if (!response.ok) throw new Error('Failed to fetch skills');
        const data = await response.json();
        setAvailableSkills(data);
        toast.success('Skills loaded', `${data.length} skills available for assignment`);
      } catch (error) {
        console.error('Error fetching skills:', error);
        toast.error('Failed to load skills', 'Some features may not work properly. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [toast]);

  // Initialize form data
  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        employeeCode: resource.employeeCode,
        homeTeam: resource.homeTeam,
        employmentType: resource.employmentType,
        monthlyRate: resource.monthlyRate,
        capacityHoursPerWeek: resource.capacityHoursPerWeek,
        availabilityCalendar: resource.availabilityCalendar || '',
        skills: resource.skills || [],
      });
    }
  }, [resource]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.employeeCode.trim()) newErrors.employeeCode = 'Employee code is required';
    if (!formData.homeTeam.trim()) newErrors.homeTeam = 'Home team is required';
    if (formData.monthlyRate <= 0) newErrors.monthlyRate = 'Monthly rate must be positive';
    if (formData.capacityHoursPerWeek <= 0) newErrors.capacityHoursPerWeek = 'Capacity must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    
    const payload = {
      ...formData,
      skills: formData.skills.map(skill => ({
        skillId: skill.skillId,
        level: skill.level,
      })),
    };

    const url = resource ? '/api/resources' : '/api/resources';
    const method = resource ? 'PUT' : 'POST';
    
    const requestBody = resource 
      ? { id: resource.id, ...payload }
      : payload;

    // Create resource save promise
    const resourceSavePromise = fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save resource');
      }
      return response.json();
    });

    try {
      const result = await promiseToast(
        resourceSavePromise,
        {
          loading: resource ? 'Updating resource...' : 'Creating resource...',
          success: (data) => `Resource "${data.name || formData.name}" ${resource ? 'updated' : 'created'} successfully!`,
          error: (error) => error.message || 'Failed to save resource',
        }
      );

      // Success - call parent callback
      onSave();
    } catch (error) {
      console.error('Error saving resource:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save resource' });
    } finally {
      setSaving(false);
    }
  };

  // Handle skill addition
  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { skillId: '', level: 5 }],
    });
    toast.success('Skill slot added', 'Select a skill and set the proficiency level');
  };

  // Handle skill removal
  const removeSkill = (index: number) => {
    const skillToRemove = formData.skills[index];
    const skillName = availableSkills.find(s => s.id === skillToRemove.skillId)?.name || 'Skill';
    
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
    
    if (skillToRemove.skillId) {
      toast.success('Skill removed', `${skillName} has been removed from this resource`);
    }
  };

  // Handle skill change
  const updateSkill = (index: number, field: 'skillId' | 'level', value: string | number) => {
    const updatedSkills = [...formData.skills];
    if (field === 'skillId') {
      const skill = availableSkills.find(s => s.id === value);
      updatedSkills[index] = {
        ...updatedSkills[index],
        skillId: value as string,
        skillCode: skill?.code,
        skillName: skill?.name,
        skillCategory: skill?.category,
      };
    } else if (field === 'level') {
      updatedSkills[index] = {
        ...updatedSkills[index],
        level: value as number,
      };
    }
    setFormData({ ...formData, skills: updatedSkills });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {resource ? 'Edit Resource' : 'Add New Resource'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          {/* Basic Information */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Code *
                </label>
                <input
                  type="text"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.employeeCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., EMP001"
                />
                {errors.employeeCode && <p className="text-red-500 text-xs mt-1">{errors.employeeCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Team *
                </label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.homeTeam ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Development Team"
                />
                {errors.homeTeam && <p className="text-red-500 text-xs mt-1">{errors.homeTeam}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type *
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {employmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Financial & Capacity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Rate ($) *
                </label>
                <input
                  type="number"
                  value={formData.monthlyRate}
                  onChange={(e) => setFormData({ ...formData, monthlyRate: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.monthlyRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.monthlyRate && <p className="text-red-500 text-xs mt-1">{errors.monthlyRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Capacity (hours) *
                </label>
                <input
                  type="number"
                  value={formData.capacityHoursPerWeek}
                  onChange={(e) => setFormData({ ...formData, capacityHoursPerWeek: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.capacityHoursPerWeek ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="40"
                  min="0"
                  step="0.5"
                />
                {errors.capacityHoursPerWeek && <p className="text-red-500 text-xs mt-1">{errors.capacityHoursPerWeek}</p>}
              </div>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Availability</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability Calendar (Optional)
              </label>
              <textarea
                value={formData.availabilityCalendar}
                onChange={(e) => setFormData({ ...formData, availabilityCalendar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter availability notes or calendar integration details..."
              />
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Skills</h4>
              <button
                type="button"
                onClick={addSkill}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Skill
              </button>
            </div>

            {formData.skills.map((skill, index) => (
              <div key={index} className="flex items-center space-x-3 mb-3">
                <div className="flex-1">
                  <select
                    value={skill.skillId}
                    onChange={(e) => updateSkill(index, 'skillId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select a skill</option>
                    {availableSkills.map((availableSkill) => (
                      <option key={availableSkill.id} value={availableSkill.id}>
                        {availableSkill.name} ({availableSkill.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-32">
                  <select
                    value={skill.level}
                    onChange={(e) => updateSkill(index, 'level', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {formData.skills.length === 0 && (
              <p className="text-sm text-gray-500 italic">No skills added yet. Click "Add Skill" to get started.</p>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {resource ? 'Update Resource' : 'Create Resource'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}