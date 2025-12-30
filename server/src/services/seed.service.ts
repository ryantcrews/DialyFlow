import { User } from '../models/User.model';
import { Unit } from '../models/Unit.model';
import { Shift } from '../models/Shift.model';
import { authService } from './auth.service';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';

const units = [
  { name: 'West Iredell', code: 'WI' },
  { name: 'Taylorsville', code: 'TAY' },
  { name: 'Lake Norman', code: 'LN' },
  { name: 'Statesville', code: 'STA' },
  { name: 'Wilkesboro', code: 'WIL' },
];

const shiftConfigs = [
  {
    code: 'MWF_FIRST',
    name: 'Monday/Wednesday/Friday - First Shift',
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '07:00',
    endTime: '11:00',
  },
  {
    code: 'MWF_SECOND',
    name: 'Monday/Wednesday/Friday - Second Shift',
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '12:00',
    endTime: '16:00',
  },
  {
    code: 'TTH_SAT_FIRST',
    name: 'Tuesday/Thursday/Saturday - First Shift',
    days: ['Tuesday', 'Thursday', 'Saturday'],
    startTime: '07:00',
    endTime: '11:00',
  },
  {
    code: 'TTH_SAT_SECOND',
    name: 'Tuesday/Thursday/Saturday - Second Shift',
    days: ['Tuesday', 'Thursday', 'Saturday'],
    startTime: '12:00',
    endTime: '16:00',
  },
  {
    code: 'PD',
    name: 'Peritoneal Dialysis',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    startTime: undefined,
    endTime: undefined,
  },
];

export async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Seed Units
    logger.info('Seeding units...');
    const createdUnits = [];
    for (const unitData of units) {
      const existing = await Unit.findOne({ code: unitData.code });
      if (!existing) {
        const unit = await Unit.create(unitData);
        createdUnits.push(unit);
        logger.info(`Created unit: ${unit.name}`);
      } else {
        createdUnits.push(existing);
        logger.info(`Unit already exists: ${existing.name}`);
      }
    }

    // Seed Shifts for each unit
    logger.info('Seeding shifts...');
    for (const unit of createdUnits) {
      for (const shiftConfig of shiftConfigs) {
        const existing = await Shift.findOne({
          unit: unit._id,
          code: shiftConfig.code,
        });

        if (!existing) {
          const shift = await Shift.create({
            ...shiftConfig,
            unit: unit._id,
          });
          logger.info(`Created shift: ${shift.name} for ${unit.name}`);
        } else {
          logger.info(`Shift already exists: ${existing.name} for ${unit.name}`);
        }
      }
    }

    // Seed Admin User
    logger.info('Seeding admin user...');
    const adminExists = await User.findOne({ email: config.adminEmail });
    
    if (!adminExists) {
      const hashedPassword = await authService.hashPassword(config.adminPassword);
      const admin = await User.create({
        email: config.adminEmail,
        password: hashedPassword,
        firstName: config.adminFirstName,
        lastName: config.adminLastName,
        role: 'admin',
        isActive: true,
        twoFactorEnabled: false,
      });
      logger.info(`Created admin user: ${admin.email}`);
    } else {
      logger.info(`Admin user already exists: ${adminExists.email}`);
    }

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Database seeding error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const mongoose = require('mongoose');
  const { connectDatabase } = require('../utils/database');

  connectDatabase()
    .then(() => seedDatabase())
    .then(() => {
      logger.info('Seeding complete, closing database connection');
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}
