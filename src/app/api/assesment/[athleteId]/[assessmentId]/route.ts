import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Assessment, { IAssessment } from '@/models/assesment';
import AssesmentTemplate, {
  IAssessmentTemplate,
} from '@/models/assesmentTemplate';

export async function GET(
  req: NextRequest,
  // { params }: { params: { athleteId: string; assessmentId: string } }
  context: any
) {
  const { athleteId, assessmentId } = await context.params;
  if (!athleteId) {
    console.log('Missing athleteId');
    return NextResponse.json({ error: 'Missing athleteId' }, { status: 400 });
  }
  if (!assessmentId) {
    console.log('Missing assessmentId');
    return NextResponse.json(
      { error: 'Missing assessmentId' },
      { status: 400 }
    );
  }

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

    // Use lean() and cast the result to IAssessment so TS knows its structure.
    const assess = (await Assessment.findById(assessmentId)
      .lean()
      .exec()) as IAssessment | null;
    if (!assess) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check that the assessment belongs to the provided athlete
    if (assess.athleteId.toString() !== athleteId) {
      console.log('ID conflict: assessment athleteId does not match');
      return NextResponse.json({ error: 'ID conflict' }, { status: 400 });
    }

    // Similarly, fetch the template and cast its type.
    const template = (await AssesmentTemplate.findById(assess.templateId)
      .lean()
      .exec()) as IAssessmentTemplate | null;
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Transform the assessment's sections for display
    const displaySections = assess.sections.map((assessSection, sIndex) => {
      // Assuming sections match by index; adjust if needed.
      const templateSection = template.sections[sIndex];
      const responsesWithLabels = Object.entries(assessSection.responses).map(
        ([fieldId, value]) => {
          const field = templateSection
            ? templateSection.fields.find(
                (f: any) => f._id.toString() === fieldId
              )
            : null;
          return {
            fieldId,
            label: field ? field.label : fieldId,
            value,
            type: field ? field.type : 'text',
          };
        }
      );
      return {
        title: assessSection.title,
        responses: responsesWithLabels,
      };
    });

    // Return the plain assessment along with a display-friendly structure
    return NextResponse.json(
      {
        assessment: assess,
        display: {
          athleteId: assess.athleteId,
          templateId: assess.templateId,
          sections: displaySections,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
