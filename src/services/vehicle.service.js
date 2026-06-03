// services/vehicle.service.js
import { Vehicle, Flat } from '../models';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';

export const createVehicle = async (data) => {
  // Get flat to find societyId
  const flat = await Flat.findById(data.flatId);
  if (!flat) {
    throw new Error('Flat not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(flat.societyId, FEATURES.VEHICLE);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return Vehicle.create(data);
};

export const deleteVehicle = async (id) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Get flat to find societyId
  const flat = await Flat.findById(vehicle.flatId);
  if (!flat) {
    throw new Error('Associated flat not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(flat.societyId, FEATURES.VEHICLE);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  await Vehicle.findByIdAndDelete(id);
  return { success: true };
};

export const getVehicles = async (filter, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  // If filter has flatId, get societyId from flat
  if (filter.flatId) {
    const flat = await Flat.findById(filter.flatId);
    if (flat) {
      const featureCheck = await checkFeatureAccess(flat.societyId, FEATURES.VEHICLE);
      if (!featureCheck.allowed) {
        throw new Error(featureCheck.reason);
      }
    }
  }

  const [data, total] = await Promise.all([
    Vehicle.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdOn: 1 })
      .populate('flatId', 'flatNumber floor buildingId')
      .populate('createdByUserId', 'name phoneNumber')
      .lean(),
    Vehicle.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

// Additional helper method to get vehicles by society
export const getVehiclesBySociety = async (societyId, options = {}) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(societyId, FEATURES.VEHICLE);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  // Find all flats in the society
  const flats = await Flat.find({ societyId }).select('_id').lean();
  const flatIds = flats.map(f => f._id);

  const filter = { flatId: { $in: flatIds } };
  return getVehicles(filter, options);
};

// Get vehicle by ID with society check
export const getVehicleById = async (id) => {
  const vehicle = await Vehicle.findById(id)
    .populate({
      path: 'flatId',
      select: 'flatNumber floor buildingId societyId',
      populate: {
        path: 'societyId',
        model: 'Society',
        select: 'societyName'
      }
    })
    .populate('createdByUserId', 'name phoneNumber')
    .lean();

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Check feature access using the societyId from populated flat
  const societyId = vehicle.flatId?.societyId?._id || vehicle.flatId?.societyId;
  if (societyId) {
    const featureCheck = await checkFeatureAccess(societyId, FEATURES.VEHICLE);
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason);
    }
  }

  return vehicle;
};

// Update vehicle with society check
export const updateVehicle = async (id, updateData) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Get flat to find societyId
  const flat = await Flat.findById(vehicle.flatId);
  if (!flat) {
    throw new Error('Associated flat not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(flat.societyId, FEATURES.VEHICLE);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const updated = await Vehicle.findByIdAndUpdate(id, updateData, { new: true });
  return updated;
};

export const vehicleExists = async (flatId, vehicleNumber) => {
  const existingVehicles = await Vehicle.find({ flatId, vehicleNumber });
  if (existingVehicles.length === 0) return false;

  return true;
}