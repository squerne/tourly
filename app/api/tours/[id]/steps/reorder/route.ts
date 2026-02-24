import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { tourlyStore } from "@/lib/tourlyStore";

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email || !checkIsAdmin(email)) return false;
    return true;
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const params = await context.params;
        const updates = await request.json();
        await tourlyStore.reorderSteps(params.id, updates);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
