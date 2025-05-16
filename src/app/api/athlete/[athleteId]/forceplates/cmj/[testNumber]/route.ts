import prisma from '@/lib/prismaDb';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        console.log('No user ID found');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { athleteId, testNumber } = context.params;
    if (!athleteId || !testNumber) {
        console.log(`athleteId: ${athleteId}, testNumber: ${testNumber}`);
        return NextResponse.json({ message: 'Invalid parameters' }, { status: 400 });
    }
    try {
        const data = await prisma.forceCMJ.findFirst({
            where: {
                athlete: athleteId,
                id: parseInt(testNumber)
            },
            select: {
                peakPowerW: true,
                jmpHeight: true,
                RSImodified: true,
                date: true,
            }
        });
        if (!data) {
            console.log('No data found');
            return NextResponse.json({ message: 'No data found' }, { status: 404 });
        }
        return NextResponse.json({
            peakPower: data.peakPowerW,
            jumpHeight: data.jmpHeight,
            rsiModified: data.RSImodified,
            testDate: data.date,
        }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}