const { Feature } = require('../models');

const features = [
  { key: 'number_of_buildings', name: 'Number of Buildings' },
  { key: 'number_of_flats', name: 'Number of Flats' },
  { key: 'gate_entries', name: 'Gate Entries' },
  { key: 'announcements', name: 'Announcements' },
  { key: 'smart_gate_pass', name: 'Smart Gate Pass' },
  { key: 'visitor_management', name: 'Visitor Management' },
  { key: 'tenant_management', name: 'Tenant Management' },
  { key: 'flat_member_management', name: 'Flat Member Management' },
  { key: 'complaints', name: 'Complaints' },
  { key: 'vehicle', name: 'Vehicle' },
  { key: 'parking', name: 'Parking' },
  { key: 'communication', name: 'Communication' },
  { key: 'maintenance', name: 'Maintenance' },
  { key: 'offers_on_festivals', name: 'Offers On Festivals' }
];

async function seedFeatures() {
  try {
    console.log('🌱 Starting feature seeding...');

    let insertedCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    for (const feature of features) {
      // Check if feature exists by key
      const existingFeature = await Feature.findOne({ key: feature.key });

      if (!existingFeature) {
        // Feature doesn't exist - insert new
        await Feature.create(feature);
        // console.log(`✅ Inserted: ${feature.key} - ${feature.name}`);
        insertedCount++;
      } else {
        // Feature exists - check if name is different
        if (existingFeature.name !== feature.name) {
          // Name is different - update
          existingFeature.name = feature.name;
          await existingFeature.save();
          // console.log(`🔄 Updated: ${feature.key} - ${feature.name} (was: ${existingFeature.name})`);
          updatedCount++;
        } else {
          // Name is same - no action
          // console.log(`⏭️  Unchanged: ${feature.key} - ${feature.name}`);
          unchangedCount++;
        }
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Unchanged: ${unchangedCount}`);
    console.log('✅ Feature seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding features:', error);
  }
}

module.exports = seedFeatures;
