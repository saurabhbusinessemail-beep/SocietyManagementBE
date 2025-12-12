import mongoose from 'mongoose';
import logger from './logger';
const seedRoles = require("../seed/role.seeder");
const seedPermissions = require("../seed/permission.seeder");
const seedFeatures = require("../seed/feature.seeder");
const seedMenus = require("../seed/menus.seeder");
const seedRoleMenu = require("../seed/roleMenus.seeder");

const database = async () => {
  try {
    // Replace database value in the .env file with your database config url
    const DATABASE =
      process.env.NODE_ENV === 'test'
        ? process.env.DATABASE_TEST
        : process.env.DATABASE;

    await mongoose.connect(DATABASE, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to the database.');

    // Add Seed Values
    await seedRoles();
    await seedPermissions();
    await seedFeatures();
    await seedMenus();
    await seedRoleMenu();

  } catch (error) {
    logger.error('Could not connect to the database.', error);
  }
};
export default database;
