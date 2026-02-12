import { NextResponse } from 'next/server';
import { getAchievement } from '@/lib/nft/achievementTracker';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const id = params.id;
        const achievement = getAchievement(id);

        if (!achievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        const baseUrl = 'https://dust-demons.vercel.app'; // Or process.env.NEXT_PUBLIC_URL

        const metadata = {
            name: achievement.title, // Use Title like "Demon Initiate"
            symbol: 'DUST',
            description: achievement.description,
            image: `${baseUrl}/achievements/achievement_${id}.png`, // Assumes images are named by ID (e.g. achievement_first_burn.png)
            attributes: [
                { trait_type: 'Rarity', value: achievement.rarity },
                { trait_type: 'Tier', value: achievement.tier },
                { trait_type: 'Type', value: 'Achievement' }
            ],
            properties: {
                files: [
                    {
                        uri: `${baseUrl}/achievements/${id}.png`,
                        type: 'image/png'
                    }
                ],
                category: 'image'
            }
        };

        return NextResponse.json(metadata);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
