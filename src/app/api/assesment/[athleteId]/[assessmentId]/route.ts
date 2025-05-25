import { connectDB } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Assessment, { IAssessment } from '@/models/assesment';
import AssesmentTemplate, {
  IAssessmentTemplate,
} from '@/models/assesmentTemplate';

// Add scoring calculation functions
const calculateFieldScore = (field: any, value: any) => {
  if (!field.isScored || field.type !== 'number') return null;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  // Find the appropriate score range
  const range = field.scoreRanges?.find(
    (r: any) => numValue >= r.min && numValue <= r.max
  );
  
  return {
    score: range?.score ?? 0,
    maxScore: field.maxScore ?? 0,
    weight: field.weight ?? 1,
    passed: range?.score >= (field.passingScore ?? 0)
  };
};

const calculateSectionScore = (section: any, responses: any[]) => {
  if (!section.isScored) return null;

  let totalScore = 0;
  let maxPossibleScore = 0;
  let totalWeight = 0;
  let allPassed = true;

  responses.forEach((response: any) => {
    const field = section.fields.find((f: any) => f.clientId === response.fieldId);
    if (field?.isScored) {
      const fieldScore = calculateFieldScore(field, response.value);
      if (fieldScore) {
        totalScore += fieldScore.score * fieldScore.weight;
        maxPossibleScore += fieldScore.maxScore * fieldScore.weight;
        totalWeight += fieldScore.weight;
        if (!fieldScore.passed) allPassed = false;
      }
    }
  });

  if (totalWeight === 0) return null;

  const weightedScore = totalScore / totalWeight;
  const weightedMaxScore = maxPossibleScore / totalWeight;
  const percentage = (weightedScore / weightedMaxScore) * 100;

  return {
    score: weightedScore,
    maxScore: weightedMaxScore,
    percentage: percentage.toFixed(1),
    passed: allPassed && percentage >= (section.passingScore ?? 0)
  };
};

export async function GET(req: NextRequest, context: any) {
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

    // Transform sections and calculate scores
    const displaySections = assess.sections.map((assessSection, sIndex) => {
      const templateSection = template.sections[sIndex];
      const responsesWithLabels = Object.entries(assessSection.responses).map(
        ([fieldId, value]) => {
          const field = templateSection
            ? templateSection.fields.find(
                (f: any) => f._id.toString() === fieldId || f.clientId === fieldId
              )
            : null;
          const idForMapping = field?.clientId || fieldId;
          
          // Calculate field score if applicable
          const fieldScore = field ? calculateFieldScore(field, value) : null;
          
          return {
            fieldId: idForMapping,
            label: field ? field.label : fieldId,
            value,
            type: field ? field.type : 'text',
            score: fieldScore ? {
              score: fieldScore.score,
              maxScore: fieldScore.maxScore,
              percentage: ((fieldScore.score / fieldScore.maxScore) * 100).toFixed(1),
              passed: fieldScore.passed
            } : null
          };
        }
      );

      // Calculate section score if applicable
      const sectionScore = templateSection?.isScored 
        ? calculateSectionScore(templateSection, responsesWithLabels)
        : null;

      return {
        title: assessSection.title,
        responses: responsesWithLabels,
        score: sectionScore,
        isScored: templateSection?.isScored ?? false
      };
    });

    // Calculate overall assessment score
    const scoredSections = displaySections.filter(s => s.isScored);
    let totalScore = 0;
    let maxTotalScore = 0;
    let totalWeight = 0;
    let allSectionsPassed = true;

    scoredSections.forEach(section => {
      if (section.score) {
        totalScore += section.score.score * (template.sections.find(s => s.title === section.title)?.weight ?? 1);
        maxTotalScore += section.score.maxScore * (template.sections.find(s => s.title === section.title)?.weight ?? 1);
        totalWeight += (template.sections.find(s => s.title === section.title)?.weight ?? 1);
        if (!section.score.passed) allSectionsPassed = false;
      }
    });

    const overallScore = totalWeight > 0 ? {
      score: (totalScore / totalWeight).toFixed(1),
      maxScore: (maxTotalScore / totalWeight).toFixed(1),
      percentage: ((totalScore / maxTotalScore) * 100).toFixed(1),
      passed: allSectionsPassed
    } : null;

    return NextResponse.json(
      {
        assessment: assess,
        display: {
          athleteId: assess.athleteId,
          templateId: assess.templateId,
          sections: displaySections,
          graphs: template.graphs || [],
          overallScore
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
