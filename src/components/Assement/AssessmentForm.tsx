'use client';
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Loader from '@/components/Loader';
import ErrorMessage from '@/components/ErrorMessage';
import SignInPrompt from '@/components/SignInPrompt';
import Sidebar from '@/components/Dash/Sidebar';
import CoachSidebar from '@/components/Dash/CoachSidebar';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface Field {
  _id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string;
}

export interface Template {
  _id: string;
  name: string;
  desc?: string;
  fields: Field[];
}

const AssessmentForm: React.FC = () => {
  const { athleteId, templateId } = useParams();
  // const router = useRouter();
  const { user } = useUser();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // formValues holds the input values for each field (keyed by field id)
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/assesment/template/${templateId}`);
        if (!res.ok) {
          throw new Error('Error fetching template');
        }
        const data = await res.json();
        // Assume API returns { template: { ... } }
        setTemplate(data.template);
        // Initialize formValues for each field:
        const initialValues: Record<string, any> = {};
        data.template.fields.forEach((field: Field) => {
          // For checkbox, default to false; otherwise an empty string.
          initialValues[field._id] = field.type === 'checkbox' ? false : '';
        });
        setFormValues(initialValues);
      } catch (err: any) {
        setFetchError(err.message || 'Error fetching template');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  if (!user) return <SignInPrompt />;
  if (loading) return <Loader />;
  if (fetchError || !template)
    return (
      <ErrorMessage
        role={user.publicMetadata?.role as string}
        message={fetchError || 'Template not found'}
      />
    );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: Field
  ) => {
    const target = e.target;
    let newValue: any;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      newValue = target.checked;
    } else {
      newValue = target.value;
    }
    setFormValues((prev) => ({
      ...prev,
      [field._id]: newValue,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Create payload including athleteId, templateId and filled-out values.
    const payload = {
      athleteId,
      templateId,
      values: formValues,
    };

    try {
      const res = await fetch(`/api/assesment/${templateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Submission failed');
      }
      await res.json();
      setSubmitSuccess('Assessment submitted successfully!');
      // Optionally navigate or perform additional actions here.
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {user.publicMetadata?.role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Mobile Sidebar */}
      <div className="md:hidden bg-gray-100">
        {user.publicMetadata?.role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {template.name}
        </h1>
        {template.desc && <p className="text-gray-600 mb-6">{template.desc}</p>}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          {template.fields.map((field, index) => (
            <div key={field._id || index} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}{' '}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={formValues[field._id]}
                  onChange={(e) => handleChange(e, field)}
                  required={field.required}
                  className="text-black w-full p-2 border rounded"
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={formValues[field._id]}
                  onChange={(e) => handleChange(e, field)}
                  required={field.required}
                  className="text-black w-full p-2 border rounded"
                />
              )}
              {field.type === 'date' && (
                <input
                  type="date"
                  value={formValues[field._id]}
                  onChange={(e) => handleChange(e, field)}
                  required={field.required}
                  className="text-black w-full p-2 border rounded"
                />
              )}
              {field.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={formValues[field._id]}
                  onChange={(e) => handleChange(e, field)}
                  className="text-black p-2 border rounded"
                />
              )}
              {field.type === 'select' && (
                <select
                  value={formValues[field._id]}
                  onChange={(e) => handleChange(e, field)}
                  required={field.required}
                  className="text-black w-full p-2 border rounded"
                >
                  <option value="">Select an option</option>
                  {field.options && typeof field.options === 'string'
                    ? field.options.split(',').map((option, i) => (
                        <option
                          key={`${option.trim()}-${i}`}
                          value={option.trim()}
                        >
                          {option.trim()}
                        </option>
                      ))
                    : null}
                </select>
              )}
            </div>
          ))}

          {submitError && <p className="text-red-500 mb-4">{submitError}</p>}
          {submitSuccess && (
            <p className="text-green-500 mb-4">{submitSuccess}</p>
          )}
          <button
            type="submit"
            disabled={submitLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {submitLoading ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssessmentForm;
