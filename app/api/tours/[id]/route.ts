import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { tourlyStore } from "@/lib/tourlyStore";

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email || !checkIsAdmin(email)) {
        return false;
    }
    return true;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Next 15 compatible pattern
        const params = await context.params;
        const tour = await tourlyStore.getTourById(params.id);
        if (!tour) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, tour });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const params = await context.params;
        const data = await request.json();
        const tour = await tourlyStore.updateTour(params.id, data);
        return NextResponse.json({ success: true, tour });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const params = await context.params;
        await tourlyStore.deleteTour(params.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
