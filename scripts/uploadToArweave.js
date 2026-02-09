#!/usr/bin/env node
// scripts/uploadToArweave.js
// Upload achievement images and metadata to Arweave using Bundlr

const { default: Bundlr } = require('@bundlr-network/client');
const fs = require('fs');
const path = require('path');

// Configuration
const BUNDLR_NODE = 'https://node1.bundlr.network';
const CURRENCY = 'solana';
const IMAGES_DIR = path.join(__dirname, '../public/achievements');
const METADATA_DIR = path.join(__dirname, '../public/achievements/metadata');

const ACHIEVEMENTS = [
    { id: 'first_burn', name: 'First Burn', title: 'Demon Initiate', tier: 1, rarity: 'Common' },
    { id: 'dust_collector', name: 'Dust Collector', title: 'Dust Demon', tier: 2, rarity: 'Uncommon' },
    { id: 'yield_hunter', name: 'Yield Hunter', title: 'JupSOL Demon', tier: 2, rarity: 'Uncommon' },
    { id: 'prophet', name: 'Prophet', title: 'Oracle Demon', tier: 3, rarity: 'Rare' },
    { id: 'mobile_master', name: 'Mobile Master', title: 'Jupiter Demon', tier: 3, rarity: 'Rare' },
    { id: 'demon_lord', name: 'Demon Lord', title: 'Leaderboard King', tier: 4, rarity: 'Legendary' },
];

async function uploadToArweave() {
    console.log('🚀 Starting Arweave upload...\n');

    // Initialize Bundlr
    const bundlr = new Bundlr(BUNDLR_NODE, CURRENCY, process.env.SOLANA_PRIVATE_KEY);

    // Check balance
    const balance = await bundlr.getLoadedBalance();
    console.log(`💰 Bundlr balance: ${bundlr.utils.fromAtomic(balance)} SOL\n`);

    const results = {};

    for (const achievement of ACHIEVEMENTS) {
        console.log(`📤 Uploading ${achievement.name}...`);

        // 1. Upload image
        const imagePath = path.join(IMAGES_DIR, `achievement_${achievement.id}.png`);

        if (!fs.existsSync(imagePath)) {
            console.log(`⚠️  Image not found: ${imagePath}`);
            continue;
        }

        const imageData = fs.readFileSync(imagePath);
        const imageTx = await bundlr.upload(imageData, {
            tags: [
                { name: 'Content-Type', value: 'image/png' },
                { name: 'App-Name', value: 'Dust Demons' },
                { name: 'Achievement-ID', value: achievement.id },
            ],
        });

        const imageUri = `https://arweave.net/${imageTx.id}`;
        console.log(`  ✅ Image uploaded: ${imageUri}`);

        // 2. Create metadata JSON
        const metadata = {
            name: `${achievement.name} - ${achievement.title}`,
            symbol: 'DUST',
            description: `Dust Demons Achievement: ${achievement.name}. ${achievement.rarity} tier ${achievement.tier} NFT.`,
            image: imageUri,
            attributes: [
                { trait_type: 'Achievement', value: achievement.name },
                { trait_type: 'Title', value: achievement.title },
                { trait_type: 'Tier', value: achievement.tier },
                { trait_type: 'Rarity', value: achievement.rarity },
                { trait_type: 'Collection', value: 'Dust Demons Achievements' },
            ],
            properties: {
                category: 'achievement',
                files: [
                    {
                        uri: imageUri,
                        type: 'image/png',
                    },
                ],
                creators: [
                    {
                        address: process.env.NEXT_PUBLIC_CREATOR_ADDRESS || '',
                        share: 100,
                    },
                ],
            },
        };

        // 3. Upload metadata
        const metadataJson = JSON.stringify(metadata);
        const metadataTx = await bundlr.upload(metadataJson, {
            tags: [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'App-Name', value: 'Dust Demons' },
                { name: 'Achievement-ID', value: achievement.id },
            ],
        });

        const metadataUri = `https://arweave.net/${metadataTx.id}`;
        console.log(`  ✅ Metadata uploaded: ${metadataUri}\n`);

        results[achievement.id] = {
            imageUri,
            metadataUri,
        };

        // Save metadata locally for reference
        const metadataPath = path.join(METADATA_DIR, `${achievement.id}.json`);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }

    // Save results
    const resultsPath = path.join(__dirname, '../arweave-uris.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    console.log('✅ All uploads complete!');
    console.log(`📄 URIs saved to: ${resultsPath}\n`);
    console.log('Next steps:');
    console.log('1. Update src/lib/nft/config.js with these URIs');
    console.log('2. Set NEXT_PUBLIC_MERKLE_TREE in .env.local');
    console.log('3. Test minting on devnet\n');
}

// Run
uploadToArweave().catch(console.error);
