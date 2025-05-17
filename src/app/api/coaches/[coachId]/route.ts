import { connectDB } from "@/lib/db";
import Coach from "@/models/coach";
import Group from "@/models/group";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        console.log('Unauthorized');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coachId = await context.params.coachId as string;
    if (!coachId) {
        console.log('Coach ID is required');
        return NextResponse.json({ error: "Coach ID is required" }, { status: 400 });
    }
    try {
        await connectDB();

        const coach = await Coach.findById(coachId);
        if (!coach) {
            console.log('Coach not found');
            return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
        }

        const groups = await Group.find({ headCoach: coachId });

        return NextResponse.json({ coach, groups }, { status: 200 });
    } catch (error: any) {
        console.log('Error fetching coach', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}