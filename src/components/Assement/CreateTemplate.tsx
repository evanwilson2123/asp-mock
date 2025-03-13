'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string; // Comma-separated options for select type
}

const CreateTemplate: React.FC = () => {
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const { athleteId } = useParams();
  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // Ensure only ADMIN users can access this page
  if (role && role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-lg">
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Unauthorized Access
          </h1>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Add a new empty field
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: Date.now().toString(),
        label: '',
        type: 'text',
        required: false,
        options: '',
      },
    ]);
  };

  // Update a field's property
  const handleFieldChange = (
    index: number,
    key: keyof Field,
    value: string | boolean
  ) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setFields(updatedFields);
  };

  // Remove a field from the list
  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Convert comma-separated options to an array for select fields
    const templateData = {
      name: templateName,
      fields: fields.map((field) => ({
        ...field,
        options:
          field.type === 'select'
            ? field.options?.split(',').map((opt) => opt.trim())
            : undefined,
      })),
    };

    try {
      const res = await fetch('/api/assesment/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.error || 'Failed to create template');
      }

      //   const data = await res.json();
      setSuccessMessage('Template created successfully!');
      // Optionally reset the form
      setTemplateName('');
      setFields([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: Conditional rendering based on user role */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
        {/* Optional Navigation Bar */}
        <nav className="bg-white rounded-lg shadow-md mb-6 p-3 flex space-x-4 sticky top-0 z-10">
          <button
            onClick={() => router.push(`/athlete/${athleteId}`)}
            className="text-gray-700 font-semibold hover:text-gray-900 transition underline"
          >
            Profile
          </button>
          <button
            onClick={() =>
              router.push(`/athlete/${athleteId}/reports/assessments`)
            }
            className="text-gray-700 font-semibold hover:text-gray-900 transition"
          >
            Assessments
          </button>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Create Assessment Template
            </h1>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                {successMessage}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label
                  htmlFor="templateName"
                  className="block text-lg font-medium text-gray-700 mb-2"
                >
                  Template Name
                </label>
                <input
                  id="templateName"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                  className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Fields
                </h2>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="mb-6 border border-gray-200 p-4 rounded-md"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            handleFieldChange(index, 'label', e.target.value)
                          }
                          required
                          className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              'type',
                              e.target.value as FieldType
                            )
                          }
                          className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                          <option value="date">Date</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              'required',
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Required
                        </span>
                      </label>
                    </div>

                    {field.type === 'select' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Options (comma separated)
                        </label>
                        <input
                          type="text"
                          value={field.options}
                          onChange={(e) =>
                            handleFieldChange(index, 'options', e.target.value)
                          }
                          className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition"
                      >
                        Remove Field
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddField}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition mt-2"
                >
                  Add Field
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplate;
