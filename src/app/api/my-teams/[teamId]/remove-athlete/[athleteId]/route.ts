import { connectDB } from "@/lib/db";
import Group from "@/models/group";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, context: any) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = context.params.teamId as string;
    const athleteId = context.params.athleteId as string;

    if (!teamId || !athleteId) {
        return NextResponse.json({ error: "Team ID and Athlete ID are required" }, { status: 400 });
    }

    try {
        await connectDB();
        const group = await Group.findById(teamId);
        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        const athleteIndex = group.athletes.indexOf(athleteId);
        if (athleteIndex === -1) {
            return NextResponse.json({ error: "Athlete not found in group" }, { status: 404 });
        }

        group.athletes.splice(athleteIndex, 1);
        await group.save();

        return NextResponse.json({ message: "Athlete removed from group" }, { status: 200 });
        
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
    
}