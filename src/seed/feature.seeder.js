const { Feature } = require('../models');

const defaultFeatures = [
  {
    key: 'multiple_buildings',
    name: 'Multiple Buildings',
    description: 'Manage multiple buildings inside one society',
    basePrice: 0,
    rules: []
  },
  {
    key: 'tenant_manager',
    name: 'Tenant Manager',
    description: 'Manage tenant onboarding & offboarding',
    basePrice: 0,
    rules: []
  },
  {
    key: 'vehicle_entry',
    name: 'Manage Entry Vehicles',
    description: 'Vehicle entry management with timestamps',
    basePrice: 0,
    rules: []
  },
  {
    key: 'vehicle_exit',
    name: 'Manage Exit Vehicles',
    description: 'Vehicle exit management with timestamps',
    basePrice: 0,
    rules: []
  },
  {
    key: 'family_management',
    name: 'Family Management',
    description: 'Add and manage flat family members',
    basePrice: 0,
    rules: []
  },
  {
    key: 'complaint_management',
    name: 'Complaint Management',
    description: 'Full life-cycle complaint tracking',
    basePrice: 0,
    rules: []
  },
  {
    key: 'number_plate_processing',
    name: 'Number Plate Processing',
    description: 'Automatic number plate scanning & verification',
    basePrice: 100,
    rules: []
  },
  {
    key: 'gatepass_management',
    name: 'Gate Pass Management',
    description: 'Gate pass system for guests & deliveries',
    basePrice: 50,
    rules: [
      {
        type: 'count',
        count: 10, // default allowed 10 users
        rulePrice: 5, // 5 per additional user
        calculated: 50 // 10 * 5
      }
    ]
  },
  {
    key: 'vehicle_management',
    name: 'Vehicle Management',
    description: 'Add, update, view vehicles of flat',
    basePrice: 0,
    rules: []
  },
  {
    key: 'guest_management',
    name: 'Guest Management',
    description: 'Track visitors & guest entries',
    basePrice: 0,
    rules: []
  },
  {
    key: 'local_manager',
    name: 'Maintain Local Manager',
    description: 'Local representative for buildings',
    basePrice: 0,
    rules: []
  },
  {
    key: 'wifi_calling',
    name: 'Wifi Calling',
    description: 'VoIP calling inside the society',
    basePrice: 0,
    rules: []
  },
  {
    key: 'society_billing',
    name: 'Society Billing',
    description: 'Bill flats for maintenance & utilities',
    basePrice: 200,
    rules: []
  },

  // ------------------------
  // ADDITIONAL FEATURES
  // ------------------------

  {
    key: 'announcement',
    name: 'Announcement / Notice Board',
    description: 'Push notices to society members',
    basePrice: 0,
    rules: []
  },

  {
    key: 'event_management',
    name: 'Event Management',
    description: 'Manage clubhouse / hall booking',
    basePrice: 0,
    rules: []
  },

  {
    key: 'document_repository',
    name: 'Document Repository',
    description: 'Upload and share society documents',
    basePrice: 0,
    rules: []
  },

  {
    key: 'audit_logs',
    name: 'Audit Logging',
    description: 'Track user operations inside the system',
    basePrice: 0,
    rules: []
  }
];

async function seedFeatures() {
  try {
    for (let feature of defaultFeatures) {
      const exists = await Feature.findOne({ key: feature.key });
      if (!exists) {
        // calculate totals initially
        let rulesPriceTotal = 0;
        feature.rules.forEach((r) => {
          r.calculated = r.count * r.rulePrice;
          rulesPriceTotal += r.calculated;
        });
        feature.rulesPriceTotal = rulesPriceTotal;
        feature.totalPrice = feature.basePrice + rulesPriceTotal;

        await Feature.create(feature);
        console.log(`✔ Feature created: ${feature.key}`);
      } else {
        console.log(`✔ Feature Exists: ${feature.key}`);
      }
    }
  } catch (err) {
    console.error('❌ Feature seeding error:', err);
  }
}

module.exports = seedFeatures;
