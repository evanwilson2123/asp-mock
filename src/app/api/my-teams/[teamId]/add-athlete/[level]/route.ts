import { connectDB } from "@/lib/db";
import Athlete from "@/models/athlete";
import Group from "@/models/group";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = context.params.teamId as string;
    if (!teamId) {
        return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const level = context.params.level as string;
    if (!level) {
        return NextResponse.json({ error: "Level is required" }, { status: 400 });
    }

    try {
        await connectDB();
        if (level.toLowerCase() === 'all') {
            const athletes = await Athlete.find();
            return NextResponse.json({ athletes }, { status: 200 });
        } else {
            const athletes = await Athlete.find({ level: level });
        return NextResponse.json({ athletes }, { status: 200 });
        }
        
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function POST(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = context.params.teamId as string;
    if (!teamId) {
        console.log("Team ID is required");
        return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    try {
        await connectDB();

        const { athleteId } = await req.json();
        if (!athleteId) {
            return NextResponse.json({ error: "Athlete ID is required" }, { status: 400 });
        }

        const group = await Group.findById(teamId);
        if (!group) {
            console.log("\n\n\nGroup not found");
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        if (!group.athletes.includes(athleteId)) {
            group.athletes.push(athleteId);
            await group.save();
        }

        const athlete = await Athlete.findById(athleteId);

        return NextResponse.json({ message: "Athlete added to group", athlete }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}