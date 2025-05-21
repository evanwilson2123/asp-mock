import { connectDB } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import Group from '@/models/group';
import Coach from '@/models/coach';

/**
 * GET /api/my-teams/:teamId
 *
 * Fetch Athletes for a Specific Team (Group)
 *
 * This endpoint retrieves the list of athletes associated with a given team ID.
 */
export async function GET(req: NextRequest, context: any) {
  // Authenticate the user using Clerk.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Auth Failed' }, { status: 400 });
  }

  try {
    // Connect to the database
    await connectDB();

    // Access the teamId parameter from the URL
    const teamId = context.params.teamId;
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Fetch the group (team) document using teamId
    const group = await Group.findById(teamId).exec();
    if (!group) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Fetch all athletes whose IDs are in the group's athletes array
    const athletes = await Athlete.find({
      _id: { $in: group.athletes },
    }).exec();

    const headCoaches = await Coach.find({
      _id: { $in: group.headCoach  },
    }).exec();

    const assistants = await Coach.find({
      _id: { $in: group.assistants },
    }).exec();


    return NextResponse.json({ athletes, headCoaches, assistants, level: group.level }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
