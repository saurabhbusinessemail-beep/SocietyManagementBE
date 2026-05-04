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
            { key: 'vehicle', name: 'Vehicle', included: false },
            { key: 'parking', name: 'Parking', included: false },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'rent', name: 'Rent', included: false },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: false }
        ],
        // No duration options for free plan
        allowedDurations: {
            months: [],
            years: []
        },
        durationOptions: []
    },
    {
        id: 'starter-trial',
        name: 'Starter Trial',
        icon: 'rocket',
        price: '0',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: '1 month trial',
        badge: '1 MONTH FREE',
        buttonText: 'Choose Starter Trial',
        colors: {
            primary: '#059669',
            light: '#a7f3d0',
            lighter: '#d1fae5',
            border: '#a7f3d0',
            text: '#059669',
            badgeBg: '#10b981',
            button: '#10b981',
            buttonHover: '#059669',
            gradientFrom: '#d1fae5',
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
            { key: 'vehicle', name: 'Vehicle', included: true },
            { key: 'parking', name: 'Parking', included: true },
            { key: 'communication', name: 'Communication', included: true },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
        ],
        // Duration options for trial - only 1 month available
        allowedDurations: {
            months: [1],
            years: []
        },
        durationOptions: [
            { value: 1, unit: 'months', discount: 100 } // 100% discount for trial
        ]
    },
    {
        id: 'silver',
        name: 'Silver',
        icon: 'star',
        price: '10',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo',
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
            { key: 'vehicle', name: 'Vehicle', included: false },
            { key: 'parking', name: 'Parking', included: false },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
        ],
        allowedDurations: {
            months: [6],
            years: [1, 2, 3, 5, 10]
        },
        durationOptions: [
            { value: 6, unit: 'months', discount: 0 },
            { value: 1, unit: 'years', discount: 5 },   // 5% discount for 1 year
            { value: 2, unit: 'years', discount: 8 },   // 8% discount for 2 years
            { value: 3, unit: 'years', discount: 12 },  // 12% discount for 3 years
            { value: 5, unit: 'years', discount: 18 },  // 18% discount for 5 years
            { value: 10, unit: 'years', discount: 25 }  // 25% discount for 10 years
        ]
    },
    {
        id: 'gold',
        name: 'Gold',
        icon: 'zap',
        price: '20',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo',
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
            { key: 'vehicle', name: 'Vehicle', included: true },
            { key: 'parking', name: 'Parking', included: true },
            { key: 'maintenance', name: 'Maintenance', included: false },
            { key: 'rent', name: 'Rent', included: false },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
        ],
        allowedDurations: {
            months: [6],
            years: [1, 2, 3, 5, 10]
        },
        durationOptions: [
            { value: 6, unit: 'months', discount: 0 },
            { value: 1, unit: 'years', discount: 8 },   // 8% discount for 1 year
            { value: 2, unit: 'years', discount: 12 },  // 12% discount for 2 years
            { value: 3, unit: 'years', discount: 16 },  // 16% discount for 3 years
            { value: 5, unit: 'years', discount: 22 },  // 22% discount for 5 years
            { value: 10, unit: 'years', discount: 30 }  // 30% discount for 10 years
        ]
    },
    {
        id: 'platinum',
        name: 'Platinum',
        icon: 'award',
        price: '30',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo',
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
            { key: 'vehicle', name: 'Vehicle', included: true },
            { key: 'parking', name: 'Parking', included: true },
            { key: 'maintenance', name: 'Maintenance', included: true },
            { key: 'rent', name: 'Rent', included: true },
            { key: 'communication', name: 'Communication', included: false },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
        ],
        allowedDurations: {
            months: [6],
            years: [1, 2, 3, 5, 10]
        },
        durationOptions: [
            { value: 6, unit: 'months', discount: 0 },
            { value: 1, unit: 'years', discount: 10 },  // 10% discount for 1 year
            { value: 2, unit: 'years', discount: 15 },  // 15% discount for 2 years
            { value: 3, unit: 'years', discount: 20 },  // 20% discount for 3 years
            { value: 5, unit: 'years', discount: 25 },  // 25% discount for 5 years
            { value: 10, unit: 'years', discount: 35 }  // 35% discount for 10 years
        ]
    },
    {
        id: 'diamond',
        name: 'Diamond',
        icon: 'gem',
        price: '40',
        priceSuffix: '₹',
        priceNote: '/flat',
        period: 'mo',
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
            { key: 'vehicle', name: 'Vehicle', included: true },
            { key: 'parking', name: 'Parking', included: true },
            { key: 'maintenance', name: 'Maintenance', included: true },
            { key: 'rent', name: 'Rent', included: true },
            { key: 'communication', name: 'Communication', included: true },
            { key: 'offers_on_festivals', name: 'Offers On Festivals', included: true }
        ],
        allowedDurations: {
            months: [6],
            years: [1, 2, 3, 5, 10]
        },
        durationOptions: [
            { value: 6, unit: 'months', discount: 0 },
            { value: 1, unit: 'years', discount: 12 },  // 12% discount for 1 year
            { value: 2, unit: 'years', discount: 18 },  // 18% discount for 2 years
            { value: 3, unit: 'years', discount: 24 },  // 24% discount for 3 years
            { value: 5, unit: 'years', discount: 30 },  // 30% discount for 5 years
            { value: 10, unit: 'years', discount: 40 }  // 40% discount for 10 years
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
                // Check if data matches (excluding timestamps and _id)
                const existingPlanObj = existingPlan.toObject();
                delete existingPlanObj._id;
                delete existingPlanObj.createdAt;
                delete existingPlanObj.updatedAt;
                delete existingPlanObj.__v;

                const newPlanObj = { ...planData };

                // Compare JSON strings
                const isSame = JSON.stringify(existingPlanObj) === JSON.stringify(newPlanObj);

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