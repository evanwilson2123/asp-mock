import { connectDB } from '@/lib/db';
import Athlete from '@/models/athlete';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


export async function PUT(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        console.log('Unauthorized');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const athleteId = await context.params.athleteId as string;
    if (!athleteId) {
        console.log('Missing athlete ID');
        return NextResponse.json({ error: "Missing athlete ID" }, { status: 400 });
    }
    const { height: newHeight } = await req.json();
    if (!newHeight) {
        console.log('Missing new height');
        return NextResponse.json({ error: "Missing new height" }, { status: 400 });
    }
    try {
        await connectDB();

        const athlete = await Athlete.findById(athleteId);
        if (!athlete) {
            console.log("Athlete not found");
            return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
        }
        if (athlete.height !== newHeight) athlete.height = newHeight;
        await athlete.save();
        return NextResponse.json({ height: newHeight }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}