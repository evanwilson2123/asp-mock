import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// interface Data {
//   value: number;
//   date: Date;
// }

// interface LineData {
//   metric: string;
//   values: Data[];
// }

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    console.log('Unauthenticated Request');
    return NextResponse.json(
      { error: 'Unauthenticated Request' },
      { status: 404 }
    );
  }
  try {
    return NextResponse.json({ message: 'test' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
