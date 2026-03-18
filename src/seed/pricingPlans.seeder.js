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
            { key: 'number_of_buildings', name: 'Number of Buildings', value: '1 Building', included: true },
            { key: 'number_of_flats', name: 'Number of Flats', value: '10 Flats', included: true },
            { key: 'gate_entries', name: 'Gate Entries', included: true },
            { key: 'announcements', name: 'Announcements', included: true },
            { key: 'smart_gate_pass', name: 'Smart Gate Pass', included: false },
            { key: 'visitor_management', name: 'Visitor Management', included: false },
            { key: 'tenant_management', name: 'Tenant Management', included: false },
            { key: 'flat_member_management', name: 'Flat Member Management', included: false },
            { key: 'complaints', name: 'Complaints', included: false },
            { key: 'events', name: 'Vehicle', included: false },
            { key: 'parking_vehicle', name: 'Parking', included: false },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: false }
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
            { key: 'number_of_buildings', name: 'Number of Buildings', value: 'Unlimited', included: true },
            { key: 'number_of_flats', name: 'Number of Flats', value: 'Unlimited', included: true },
            { key: 'gate_entries', name: 'Gate Entries', included: true },
            { key: 'announcements', name: 'Announcements', included: true },
            { key: 'smart_gate_pass', name: 'Smart Gate Pass', included: true },
            { key: 'visitor_management', name: 'Visitor Management', included: true },
            { key: 'tenant_management', name: 'Tenant Management', included: true },
            { key: 'flat_member_management', name: 'Flat Member Management', included: true },
            { key: 'complaints', name: 'Complaints', included: false },
            { key: 'events', name: 'Vehicle', included: false },
            { key: 'parking_vehicle', name: 'Parking', included: false },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
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
            { key: 'number_of_buildings', name: 'Number of Buildings', value: 'Unlimited', included: true },
            { key: 'number_of_flats', name: 'Number of Flats', value: 'Unlimited', included: true },
            { key: 'gate_entries', name: 'Gate Entries', included: true },
            { key: 'announcements', name: 'Announcements', included: true },
            { key: 'smart_gate_pass', name: 'Smart Gate Pass', included: true },
            { key: 'visitor_management', name: 'Visitor Management', included: true },
            { key: 'tenant_management', name: 'Tenant Management', included: true },
            { key: 'flat_member_management', name: 'Flat Member Management', included: true },
            { key: 'complaints', name: 'Complaints', included: true },
            { key: 'events', name: 'Vehicle', included: true },
            { key: 'parking_vehicle', name: 'Parking', included: true },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
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
            { key: 'number_of_buildings', name: 'Number of Buildings', value: 'Unlimited', included: true },
            { key: 'number_of_flats', name: 'Number of Flats', value: 'Unlimited', included: true },
            { key: 'gate_entries', name: 'Gate Entries', included: true },
            { key: 'announcements', name: 'Announcements', included: true },
            { key: 'smart_gate_pass', name: 'Smart Gate Pass', included: true },
            { key: 'visitor_management', name: 'Visitor Management', included: true },
            { key: 'tenant_management', name: 'Tenant Management', included: true },
            { key: 'flat_member_management', name: 'Flat Member Management', included: true },
            { key: 'complaints', name: 'Complaints', included: true },
            { key: 'events', name: 'Vehicle', included: true },
            { key: 'parking_vehicle', name: 'Parking', included: true },
            { key: 'communication', name: 'Communication', included: true },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
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
            { key: 'number_of_buildings', name: 'Number of Buildings', value: 'Unlimited', included: true },
            { key: 'number_of_flats', name: 'Number of Flats', value: 'Unlimited', included: true },
            { key: 'gate_entries', name: 'Gate Entries', included: true },
            { key: 'announcements', name: 'Announcements', included: true },
            { key: 'smart_gate_pass', name: 'Smart Gate Pass', included: true },
            { key: 'visitor_management', name: 'Visitor Management', included: true },
            { key: 'tenant_management', name: 'Tenant Management', included: true },
            { key: 'flat_member_management', name: 'Flat Member Management', included: true },
            { key: 'complaints', name: 'Complaints', included: true },
            { key: 'events', name: 'Vehicle', included: true },
            { key: 'parking_vehicle', name: 'Parking', included: true },
            { key: 'communication', name: 'Communication', included: true },
            { key: 'maintenance', name: 'Maintenance', included: true },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
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