'use client';
import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { useUser } from '@clerk/nextjs';
import CoachSidebar from '@/components/Dash/CoachSidebar';
import Sidebar from '@/components/Dash/Sidebar';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export interface ScoreRange {
  min: number;
  max: number;
  score: number;
}

export interface Field {
  id: string; // Ephemeral ID from the client
  label: string;
  type: FieldType;
  required: boolean;
  options?: string; // Comma-separated options for select type
  isScored?: boolean;
  scoreRanges?: ScoreRange[];
  maxScore?: number;
  weight?: number;
}

export interface Section {
  id: string;
  title: string;
  fields: Field[];
  isScored?: boolean;
  maxScore?: number;
  weight?: number;
  passingScore?: number;
}

export interface Graph {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie';
  fieldIds: string[]; // List of numeric field IDs selected for this graph
}

const CreateTemplate: React.FC = () => {
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { user } = useUser();
  const role = user?.publicMetadata?.role;

  // // Add new state for managing score ranges
  // const [editingScoreRanges, setEditingScoreRanges] = useState<{
  //   sectionIndex: number;
  //   fieldIndex: number;
  // } | null>(null);

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

  // Section handling functions
  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: nanoid(),
        title: '',
        fields: [],
        isScored: false,
        maxScore: 0,
        weight: 1,
        passingScore: 0
      },
    ]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    setSections((prev) => prev.filter((_, i) => i !== sectionIndex));
  };

  const handleSectionTitleChange = (sectionIndex: number, value: string) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].title = value;
      return updated;
    });
  };

  // Field handling functions
  const handleAddField = (sectionIndex: number) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].fields.push({
        id: nanoid(),
        label: '',
        type: 'text',
        required: false,
        options: '',
        isScored: false,
        scoreRanges: [],
        maxScore: 0,
        weight: 1
      });
      return updated;
    });
  };

  const handleFieldChange = (
    sectionIndex: number,
    fieldIndex: number,
    key: keyof Field,
    value: string | boolean | number
  ) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].fields[fieldIndex] = {
        ...updated[sectionIndex].fields[fieldIndex],
        [key]: value,
      };
      return updated;
    });
  };

  const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].fields = updated[sectionIndex].fields.filter(
        (_, i) => i !== fieldIndex
      );
      return updated;
    });
  };

  // Graph handling functions
  const addGraph = () => {
    setGraphs((prev) => [
      ...prev,
      {
        id: nanoid(), // Use nanoid for unique graph ID
        title: '',
        type: 'bar',
        fieldIds: [],
      },
    ]);
  };

  const removeGraph = (graphIndex: number) => {
    setGraphs((prev) => prev.filter((_, i) => i !== graphIndex));
  };

  const handleGraphChange = (
    graphIndex: number,
    key: keyof Graph,
    value: string
  ) => {
    setGraphs((prev) => {
      const updated = [...prev];
      updated[graphIndex] = {
        ...updated[graphIndex],
        [key]: value,
      };
      return updated;
    });
  };

  const handleGraphFieldToggle = (
    graphIndex: number,
    fieldId: string,
    checked: boolean
  ) => {
    setGraphs((prev) => {
      const updated = [...prev];
      let currentFieldIds = updated[graphIndex].fieldIds;
      if (checked) {
        if (!currentFieldIds.includes(fieldId)) {
          currentFieldIds.push(fieldId);
        }
      } else {
        currentFieldIds = currentFieldIds.filter((id) => id !== fieldId);
      }
      updated[graphIndex].fieldIds = currentFieldIds;
      return updated;
    });
  };

  // Compute available numeric fields from sections
  const availableNumericFields = sections.flatMap((section) =>
    section.fields.filter((field) => field.type === 'number')
  );

  // Add function to handle score range changes
  const handleScoreRangeChange = (
    sectionIndex: number,
    fieldIndex: number,
    rangeIndex: number,
    key: keyof ScoreRange,
    value: number
  ) => {
    setSections((prev) => {
      const updated = [...prev];
      const field = updated[sectionIndex].fields[fieldIndex];
      if (!field.scoreRanges) {
        field.scoreRanges = [];
      }
      if (!field.scoreRanges[rangeIndex]) {
        field.scoreRanges[rangeIndex] = { min: 0, max: 0, score: 0 };
      }
      field.scoreRanges[rangeIndex] = {
        ...field.scoreRanges[rangeIndex],
        [key]: value,
      };
      return updated;
    });
  };

  // Add function to add/remove score ranges
  const handleAddScoreRange = (sectionIndex: number, fieldIndex: number) => {
    setSections((prev) => {
      const updated = [...prev];
      const field = updated[sectionIndex].fields[fieldIndex];
      if (!field.scoreRanges) {
        field.scoreRanges = [];
      }
      field.scoreRanges.push({ min: 0, max: 0, score: 0 });
      return updated;
    });
  };

  const handleRemoveScoreRange = (
    sectionIndex: number,
    fieldIndex: number,
    rangeIndex: number
  ) => {
    setSections((prev) => {
      const updated = [...prev];
      const field = updated[sectionIndex].fields[fieldIndex];
      if (field.scoreRanges) {
        field.scoreRanges = field.scoreRanges.filter((_, i) => i !== rangeIndex);
      }
      return updated;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const templateData = {
      name: templateName,
      desc: templateDesc,
      sections: sections.map((section) => ({
        title: section.title,
        isScored: section.isScored,
        maxScore: section.maxScore,
        weight: section.weight,
        passingScore: section.passingScore,
        fields: section.fields.map((field) => ({
          label: field.label,
          type: field.type,
          required: field.required,
          options:
            field.type === 'select'
              ? field.options?.split(',').map((opt) => opt.trim())
              : undefined,
          clientId: field.id,
          isScored: field.isScored,
          scoreRanges: field.scoreRanges,
          maxScore: field.maxScore,
          weight: field.weight,
        })),
      })),
      graphs: graphs.map((graph) => ({
        title: graph.title,
        type: graph.type,
        fieldIds: graph.fieldIds,
      })),
    };

    try {
      const res = await fetch('/api/assesment/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.error || 'Failed to create template');
      }
      setSuccessMessage('Template created successfully!');
      setTemplateName('');
      setTemplateDesc('');
      setSections([]);
      setGraphs([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add scoring configuration UI to the field section
  const renderFieldScoring = (sectionIndex: number, fieldIndex: number, field: Field) => {
    if (field.type !== 'number') return null;

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={field.isScored ?? false}
              onChange={(e) =>
                handleFieldChange(sectionIndex, fieldIndex, 'isScored', e.target.checked)
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Enable Scoring</span>
          </label>
        </div>

        {field.isScored && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Score
                </label>
                <input
                  type="number"
                  value={field.maxScore || ''}
                  onChange={(e) =>
                    handleFieldChange(
                      sectionIndex,
                      fieldIndex,
                      'maxScore',
                      parseFloat(e.target.value)
                    )
                  }
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weight
                </label>
                <input
                  type="number"
                  value={field.weight || 1}
                  onChange={(e) =>
                    handleFieldChange(
                      sectionIndex,
                      fieldIndex,
                      'weight',
                      parseFloat(e.target.value)
                    )
                  }
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Ranges
              </label>
              {field.scoreRanges?.map((range, rangeIndex) => (
                <div key={rangeIndex} className="flex gap-2 mb-2 items-end">
                  <div className="flex flex-col w-1/3">
                    <label className="text-xs text-gray-500 mb-1" htmlFor={`min-${sectionIndex}-${fieldIndex}-${rangeIndex}`}>Min</label>
                    <input
                      id={`min-${sectionIndex}-${fieldIndex}-${rangeIndex}`}
                      type="number"
                      value={range.min}
                      onChange={(e) =>
                        handleScoreRangeChange(
                          sectionIndex,
                          fieldIndex,
                          rangeIndex,
                          'min',
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="Min"
                      className="text-black px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex flex-col w-1/3">
                    <label className="text-xs text-gray-500 mb-1" htmlFor={`max-${sectionIndex}-${fieldIndex}-${rangeIndex}`}>Max</label>
                    <input
                      id={`max-${sectionIndex}-${fieldIndex}-${rangeIndex}`}
                      type="number"
                      value={range.max}
                      onChange={(e) =>
                        handleScoreRangeChange(
                          sectionIndex,
                          fieldIndex,
                          rangeIndex,
                          'max',
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="Max"
                      className="text-black px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex flex-col w-1/3">
                    <label className="text-xs text-gray-500 mb-1" htmlFor={`score-${sectionIndex}-${fieldIndex}-${rangeIndex}`}>Score</label>
                    <input
                      id={`score-${sectionIndex}-${fieldIndex}-${rangeIndex}`}
                      type="number"
                      value={range.score}
                      onChange={(e) =>
                        handleScoreRangeChange(
                          sectionIndex,
                          fieldIndex,
                          rangeIndex,
                          'score',
                          parseFloat(e.target.value)
                        )
                      }
                      placeholder="Score"
                      className="text-black px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScoreRange(sectionIndex, fieldIndex, rangeIndex)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddScoreRange(sectionIndex, fieldIndex)}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add Score Range
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add section scoring UI
  const renderSectionScoring = (sectionIndex: number, section: Section) => (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={section.isScored}
            onChange={(e) =>
              handleSectionChange(sectionIndex, 'isScored', e.target.checked)
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Enable Section Scoring</span>
        </label>
      </div>

      {section.isScored && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Score
            </label>
            <input
              type="number"
              value={section.maxScore || ''}
              onChange={(e) =>
                handleSectionChange(
                  sectionIndex,
                  'maxScore',
                  parseFloat(e.target.value)
                )
              }
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weight
            </label>
            <input
              type="number"
              value={section.weight || 1}
              onChange={(e) =>
                handleSectionChange(
                  sectionIndex,
                  'weight',
                  parseFloat(e.target.value)
                )
              }
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Passing Score
            </label>
            <input
              type="number"
              value={section.passingScore || ''}
              onChange={(e) =>
                handleSectionChange(
                  sectionIndex,
                  'passingScore',
                  parseFloat(e.target.value)
                )
              }
              className="text-black w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Add handleSectionChange function
  const handleSectionChange = (
    sectionIndex: number,
    key: keyof Section,
    value: any
  ) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        [key]: value,
      };
      return updated;
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="md:hidden bg-gray-100">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>
      <div className="hidden md:block w-64 bg-gray-900 text-white">
        {role === 'COACH' ? <CoachSidebar /> : <Sidebar />}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 flex-col overflow-x-hidden">
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
              {/* Template Name */}
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

              {/* Template Description */}
              <div className="mb-8">
                <label
                  htmlFor="templateDesc"
                  className="block text-lg font-medium text-gray-700 mb-2"
                >
                  Template Description (Optional)
                </label>
                <textarea
                  id="templateDesc"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="Enter a description for the template..."
                  className="text-black w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Sections */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Sections
                </h2>
                {sections.map((section, sIndex) => (
                  <div
                    key={section.id}
                    className="mb-6 border border-gray-200 p-4 rounded-md"
                  >
                    {/* Section Title */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          handleSectionTitleChange(sIndex, e.target.value)
                        }
                        required
                        className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Add section scoring UI */}
                    {renderSectionScoring(sIndex, section)}

                    {/* Fields */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Fields
                      </h3>
                      {section.fields.map((field, fIndex) => (
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
                                  handleFieldChange(
                                    sIndex,
                                    fIndex,
                                    'label',
                                    e.target.value
                                  )
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
                                    sIndex,
                                    fIndex,
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

                          {/* Required Checkbox */}
                          <div className="mt-4">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) =>
                                  handleFieldChange(
                                    sIndex,
                                    fIndex,
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

                          {/* Select Options */}
                          {field.type === 'select' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Options (comma separated)
                              </label>
                              <input
                                type="text"
                                value={field.options}
                                onChange={(e) =>
                                  handleFieldChange(
                                    sIndex,
                                    fIndex,
                                    'options',
                                    e.target.value
                                  )
                                }
                                className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          )}

                          {/* Add field scoring UI */}
                          {renderFieldScoring(sIndex, fIndex, field)}

                          {/* Remove Field */}
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveField(sIndex, fIndex)}
                              className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition"
                            >
                              Remove Field
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddField(sIndex)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition mt-2"
                      >
                        Add Field
                      </button>
                    </div>

                    {/* Remove Section */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIndex)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                    >
                      Remove Section
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Add Section
                </button>
              </div>

              {/* Graphs Configuration */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Graphs
                </h2>
                {graphs.map((graph, gIndex) => (
                  <div key={graph.id} className="mb-6 border p-4 rounded-md">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black">
                        Graph Title
                      </label>
                      <input
                        type="text"
                        placeholder="Graph Title"
                        value={graph.title}
                        onChange={(e) =>
                          handleGraphChange(gIndex, 'title', e.target.value)
                        }
                        className="text-black mb-2 p-2 border rounded w-full"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black">
                        Graph Type
                      </label>
                      <select
                        value={graph.type}
                        onChange={(e) =>
                          handleGraphChange(gIndex, 'type', e.target.value)
                        }
                        className="text-black mb-2 p-2 border rounded w-full"
                      >
                        <option value="bar">Bar</option>
                        <option value="line">Line</option>
                        <option value="pie">Pie</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="text-black block font-medium mb-1">
                        Select Fields:
                      </label>
                      {availableNumericFields.map((field) => (
                        <div key={field.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={graph.fieldIds.includes(field.id)}
                            onChange={(e) =>
                              handleGraphFieldToggle(
                                gIndex,
                                field.id,
                                e.target.checked
                              )
                            }
                            className="text-black mr-2"
                          />
                          <span className="text-black">{field.label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGraph(gIndex)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Remove Graph
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGraph}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Add Graph
                </button>
              </div>

              {/* Submit Button */}
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
