import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { tourlyStore } from "@/lib/tourlyStore";

export const dynamic = 'force-dynamic';

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email || !checkIsAdmin(email)) {
        return false;
    }
    return true;
}

export async function GET(request: NextRequest) {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const filter = searchParams.get('filter') || undefined;

    try {
        const tours = await tourlyStore.getTours(search, filter);
        return NextResponse.json({ success: true, tours });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const tour = await tourlyStore.createTour(data);
        return NextResponse.json({ success: true, tour });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
