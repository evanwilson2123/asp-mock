import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import AssesmentTemplate from '@/models/assesmentTemplate';

// Add validation functions
const validateScoreRange = (range: any) => {
  if (!range || typeof range !== 'object') return false;
  const { min, max, score } = range;
  return (
    typeof min === 'number' &&
    typeof max === 'number' &&
    typeof score === 'number' &&
    min <= max &&
    score >= 0
  );
};

const validateField = (field: any) => {
  if (!field || typeof field !== 'object') return false;
  const { label, type, required, isScored, scoreRanges, maxScore, weight } = field;

  // Basic field validation
  if (!label || typeof label !== 'string') return false;
  if (!type || !['text', 'number', 'select', 'date', 'checkbox'].includes(type)) return false;
  if (typeof required !== 'boolean') return false;

  // Scoring validation
  if (isScored) {
    if (typeof isScored !== 'boolean') return false;
    if (type !== 'number') return false;
    if (typeof maxScore !== 'number' || maxScore < 0) return false;
    if (typeof weight !== 'number' || weight <= 0) return false;
    if (scoreRanges && !Array.isArray(scoreRanges)) return false;
    if (scoreRanges && !scoreRanges.every(validateScoreRange)) return false;
  }

  return true;
};

const validateSection = (section: any) => {
  if (!section || typeof section !== 'object') return false;
  const { title, fields, isScored, maxScore, weight, passingScore } = section;

  // Basic section validation
  if (!title || typeof title !== 'string') return false;
  if (!Array.isArray(fields)) return false;
  if (!fields.every(validateField)) return false;

  // Section scoring validation
  if (isScored) {
    if (typeof isScored !== 'boolean') return false;
    if (typeof maxScore !== 'number' || maxScore < 0) return false;
    if (typeof weight !== 'number' || weight <= 0) return false;
    if (passingScore !== undefined && (typeof passingScore !== 'number' || passingScore < 0)) return false;
  }

  return true;
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthorized Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();

    // Parse the request body
    const { name, desc, sections, graphs } = await req.json();

    // Validate the request payload
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Sections must be an array' },
        { status: 400 }
      );
    }

    // Validate each section and its fields
    if (!sections.every(validateSection)) {
      return NextResponse.json(
        { error: 'Invalid section or field configuration' },
        { status: 400 }
      );
    }

    if (graphs && !Array.isArray(graphs)) {
      return NextResponse.json(
        { error: 'Invalid graphs payload' },
        { status: 400 }
      );
    }

    // Validate graph configuration
    if (graphs) {
      const validGraphTypes = ['bar', 'line', 'pie'];
      const validGraphs = graphs.every(
        (graph: any) =>
          graph &&
          typeof graph === 'object' &&
          typeof graph.title === 'string' &&
          validGraphTypes.includes(graph.type) &&
          Array.isArray(graph.fieldIds)
      );

      if (!validGraphs) {
        return NextResponse.json(
          { error: 'Invalid graph configuration' },
          { status: 400 }
        );
      }
    }

    // Create a new template instance
    const newTemplate = new AssesmentTemplate({
      name,
      desc,
      sections: sections.map((section: any) => ({
        ...section,
        // Ensure scoring fields are properly typed
        isScored: Boolean(section.isScored),
        maxScore: Number(section.maxScore) || 0,
        weight: Number(section.weight) || 1,
        passingScore: Number(section.passingScore) || 0,
        fields: section.fields.map((field: any) => ({
          ...field,
          // Ensure field scoring fields are properly typed
          isScored: Boolean(field.isScored),
          maxScore: Number(field.maxScore) || 0,
          weight: Number(field.weight) || 1,
          scoreRanges: Array.isArray(field.scoreRanges)
            ? field.scoreRanges.map((range: any) => ({
                min: Number(range.min) || 0,
                max: Number(range.max) || 0,
                score: Number(range.score) || 0,
              }))
            : [],
        })),
      })),
      graphs,
    });

    // Save the new template to the database
    await newTemplate.save();

    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 400 }
    );
  }
  try {
    await connectDB();
    const templates = await AssesmentTemplate.find({ available: true }).exec();
    console.log(templates);
    return NextResponse.json({ templates }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
