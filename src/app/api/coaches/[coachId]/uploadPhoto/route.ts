import { connectDB } from "@/lib/db";
import Coach from "@/models/coach";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        console.log('Unauthorized');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coachId = await context.params.coachId;
    if (!coachId) {
        console.log('Coach ID is required');
        return NextResponse.json({ error: 'Missing coach ID' }, { status: 400 });
    }

    try {
        await connectDB();
        const coach = await Coach.findById(coachId);
        if (!coach) {
            console.log('Coach not found');
            return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
        }

        const formData = await req.formData();
        const photo = formData.get('photo');
        if (!photo) {
            console.log('Missing photo');
            return NextResponse.json({ error: 'Missing photo' }, { status: 400 });
        }

        try {
            const blob = await put(coach._id + '_profilePhoto', photo, {
                access: 'public',
            });
            coach.photoUrl = blob.url;
            await coach.save();
            return NextResponse.json({ photoUrl: blob.url }, { status: 200 });
        } catch (error: any) {
            console.error(error);
            return NextResponse.json({ error: 'Error uploading image' }, { status: 500 });
        }  
    } catch (error: any) {
        console.log('Error uploading photo', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}