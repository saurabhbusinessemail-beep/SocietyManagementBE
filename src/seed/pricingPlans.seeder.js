const mongoose = require('mongoose');
import { PricingPlan } from '../models';

const plansData = [
    {
        id: 'basic',
        name: 'Basic',
        icon: 'building2',
        price: 'Free',
        period: 'forever',
        buttonText: 'Get Started',
        colors: {
            primary: '#475569',
            light: '#e2e8f0',
            lighter: '#f1f5f9',
            border: '#e2e8f0',
            text: '#334155',
            button: '#334155',
            buttonHover: '#1e293b',
            gradientFrom: '#f1f5f9',
            gradientTo: '#f8fafc',
        },
        features: [
            { name: 'Add Buildings', value: '1 Building', included: true },
            { name: 'Number of Flats', value: '10–12 Flats', included: true },
            { name: 'Gate Entries', included: true },
            { name: 'Announcements', included: true },
            { name: 'Smart Gate Pass', included: false },
            { name: 'Visitor Management', included: false },
            { name: 'Tenant Management', included: false },
            { name: 'Flat Member Management', included: false },
            { name: 'Complaints', included: false },
            { name: 'Events', included: false },
            { name: 'Parking / Vehicle', included: false },
            { name: 'Communication', included: false },
            { name: 'Maintenance', included: false },
            { name: 'Offers & Festivals', included: false }
        ]
    },
    {
        id: 'silver',
        name: 'Silver',
        icon: 'star',
        price: '10',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo, billed yearly',
        buttonText: 'Get Started',
        colors: {
            primary: '#1d4ed8',
            light: '#bfdbfe',
            lighter: '#dbeafe',
            border: '#bfdbfe',
            text: '#1d4ed8',
            button: '#2563eb',
            buttonHover: '#1d4ed8',
            gradientFrom: '#dbeafe',
            gradientTo: '#eff6ff'
        },
        features: [
            { name: 'Add Buildings', value: 'Unlimited', included: true },
            { name: 'Number of Flats', value: 'Unlimited', included: true },
            { name: 'Gate Entries', included: true },
            { name: 'Announcements', included: true },
            { name: 'Smart Gate Pass', included: true },
            { name: 'Visitor Management', included: true },
            { name: 'Tenant Management', included: true },
            { name: 'Flat Member Management', included: true },
            { name: 'Complaints', included: false },
            { name: 'Events', included: false },
            { name: 'Parking / Vehicle', included: false },
            { name: 'Communication', included: false },
            { name: 'Maintenance', included: false },
            { name: 'Offers & Festivals', included: true }
        ]
    },
    {
        id: 'gold',
        name: 'Gold',
        icon: 'zap',
        price: '20',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo, billed yearly',
        badge: 'POPULAR',
        buttonText: 'Get Started',
        isPopular: true,
        colors: {
            primary: '#b45309',
            light: '#fcd34d',
            lighter: '#fde68a',
            border: '#fcd34d',
            text: '#b45309',
            badgeBg: '#f59e0b',
            buttonFrom: '#f59e0b',
            buttonTo: '#eab308',
            gradientFrom: '#fde68a',
            gradientTo: '#fffbeb'
        },
        features: [
            { name: 'Add Buildings', value: 'Unlimited', included: true },
            { name: 'Number of Flats', value: 'Unlimited', included: true },
            { name: 'Gate Entries', included: true },
            { name: 'Announcements', included: true },
            { name: 'Smart Gate Pass', included: true },
            { name: 'Visitor Management', included: true },
            { name: 'Tenant Management', included: true },
            { name: 'Flat Member Management', included: true },
            { name: 'Complaints', included: true },
            { name: 'Events', included: true },
            { name: 'Parking / Vehicle', included: true },
            { name: 'Communication', included: false },
            { name: 'Maintenance', included: false },
            { name: 'Offers & Festivals', included: true }
        ]
    },
    {
        id: 'platinum',
        name: 'Platinum',
        icon: 'award',
        price: '30',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo, billed yearly',
        buttonText: 'Get Started',
        colors: {
            primary: '#6d28d9',
            light: '#ddd6fe',
            lighter: '#ede9fe',
            border: '#ddd6fe',
            text: '#6d28d9',
            button: '#7c3aed',
            buttonHover: '#6d28d9',
            gradientFrom: '#ede9fe',
            gradientTo: '#f5f3ff'
        },
        features: [
            { name: 'Add Buildings', value: 'Unlimited', included: true },
            { name: 'Number of Flats', value: 'Unlimited', included: true },
            { name: 'Gate Entries', included: true },
            { name: 'Announcements', included: true },
            { name: 'Smart Gate Pass', included: true },
            { name: 'Visitor Management', included: true },
            { name: 'Tenant Management', included: true },
            { name: 'Flat Member Management', included: true },
            { name: 'Complaints', included: true },
            { name: 'Events', included: true },
            { name: 'Parking / Vehicle', included: true },
            { name: 'Communication', included: true },
            { name: 'Maintenance', included: false },
            { name: 'Offers & Festivals', included: true }
        ]
    },
    {
        id: 'diamond',
        name: 'Diamond',
        icon: 'gem',
        price: '40',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo, billed yearly',
        badge: 'BEST VALUE',
        buttonText: 'Get Started',
        isBestValue: true,
        colors: {
            primary: '#0f766e',
            light: '#99f6e4',
            lighter: '#ccfbf1',
            border: '#99f6e4',
            text: '#0f766e',
            badgeBg: '#14b8a6',
            buttonFrom: '#14b8a6',
            buttonTo: '#06b6d4',
            gradientFrom: '#ccfbf1',
            gradientTo: '#f0fdfa'
        },
        features: [
            { name: 'Add Buildings', value: 'Unlimited', included: true },
            { name: 'Number of Flats', value: 'Unlimited', included: true },
            { name: 'Gate Entries', included: true },
            { name: 'Announcements', included: true },
            { name: 'Smart Gate Pass', included: true },
            { name: 'Visitor Management', included: true },
            { name: 'Tenant Management', included: true },
            { name: 'Flat Member Management', included: true },
            { name: 'Complaints', included: true },
            { name: 'Events', included: true },
            { name: 'Parking / Vehicle', included: true },
            { name: 'Communication', included: true },
            { name: 'Maintenance', included: true },
            { name: 'Offers & Festivals', included: true }
        ]
    }
];

const seedPricingPlans = async () => {
    try {
        console.log('Starting pricing plans seed...');

        let insertedCount = 0;
        let updatedCount = 0;
        let unchangedCount = 0;

        for (const planData of plansData) {
            // Calculate featureCount
            const totalFeatures = planData.features.length;
            const includedCount = planData.features.filter(f => f.included).length;
            planData.featureCount = `${includedCount}/${totalFeatures}`;

            // Check if plan exists
            const existingPlan = await PricingPlan.findOne({ id: planData.id });

            if (!existingPlan) {
                // Insert new plan
                await PricingPlan.create(planData);
                console.log(`✅ Inserted: ${planData.name} (${planData.id})`);
                insertedCount++;
            } else {
                // Check if data matches
                const isSame = JSON.stringify(existingPlan.toObject()) === JSON.stringify(await PricingPlan.findOne({ id: planData.id }).lean());

                if (!isSame) {
                    // Update existing plan
                    await PricingPlan.findOneAndUpdate(
                        { id: planData.id },
                        planData,
                        { new: true, runValidators: true }
                    );
                    console.log(`🔄 Updated: ${planData.name} (${planData.id})`);
                    updatedCount++;
                } else {
                    console.log(`⏭️ Unchanged: ${planData.name} (${planData.id})`);
                    unchangedCount++;
                }
            }
        }

        console.log('\n=== Seed Summary For Pricing Plan ===');
        console.log(`✅ Inserted: ${insertedCount}`);
        console.log(`🔄 Updated: ${updatedCount}`);
        console.log(`⏭️ Unchanged: ${unchangedCount}`);
        console.log('✅ Pricing plans seed completed successfully');

    } catch (error) {
        console.error('❌ Error seeding pricing plans:', error);
        throw error;
    }
};

module.exports = seedPricingPlans;