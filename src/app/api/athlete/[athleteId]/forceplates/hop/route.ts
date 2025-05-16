import prisma from "@/lib/prismaDb";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        console.log('Unauthorized');
        return NextResponse.json({ error: "Unauthorized Request" }, { status: 401 });
    }

    const athleteId = await context.params.athleteId as string;
    if (!athleteId) {
        console.log('Athlete ID is required');
        return NextResponse.json({ error: "Athlete ID is required" }, { status: 400 });
    }

    try {
        const data = await prisma.forceHop.findMany({
            where: {
                athlete: athleteId,
            },
            select: {
                bestRSIF: true,
                date: true,
            },
            orderBy: {
                date: 'asc',
            }
        });

        return NextResponse.json({ data }, { status: 200 });
        
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}