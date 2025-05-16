import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        console.log('Unauthorized');
        return NextResponse.json({ error: 'Unauthorized Request' }, { status: 401 });
    }

    const athletId = await context.params.athleteId as string;
    if (!athletId) {
        console.log('Athlete ID is required');
        return NextResponse.json({ error: 'Athlete ID is required' }, { status: 400 });
    }

    try {
        const data = await prisma.forceSJ.findMany({ 
            where: {
                athlete: athletId,
            },
            select: {
                peakPowerW: true,
                jumpHeight: true,
                RSImodified: true,
                date: true,
            }
        })
        return NextResponse.json({ data: data }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch athlete data" }, { status: 500 });
    }
}