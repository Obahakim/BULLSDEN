import { NextResponse } from "next/server";

const IDS = "bitcoin,ethereum,binancecoin,solana";

export async function GET() {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${IDS}&vs_currencies=usd&include_24hr_change=true`,
    { next: { revalidate: 60 } }
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Price feed unavailable." }, { status: 502 });
  }

  return NextResponse.json(await response.json());
}
