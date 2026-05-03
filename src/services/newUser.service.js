import { Flat, FlatMember } from '../models';
import { moveInTenant, getCurrentResidingType } from '../services/flat.service';

export const creatFlatMember = async (data, loggedInUserId) => {

  // Create the flat member record
  const member = await FlatMember.create(data);

  // Handle residing type for all members
  if (data.residingType) {
    if (data.isTenant && data.leaseStart) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const leaseStart = new Date(data.leaseStart);
      const leaseEnd = data.leaseEnd ? new Date(data.leaseEnd) : undefined;
      leaseStart.setHours(0, 0, 0, 0);
      if (leaseEnd) leaseEnd.setHours(0, 0, 0, 0);

      if (today >= leaseStart && (!leaseEnd || today <= leaseEnd)) {
        // Today is within lease → vacate existing occupants
        await moveInTenant(member._id, loggedInUserId, leaseStart);
      }
    } else if (data.isOwner && data.residingType === 'Self') {
      // Owner joining and residing themselves
      await Flat.findByIdAndUpdate(data.flatId, {
        $set: {
          residingType: 'Self',
          modifiedOn: new Date(),
          modifiedByUserId: loggedInUserId
        }
      });
    } else if (data.residingType === 'Vacant') {
      // Flat is vacant
      await Flat.findByIdAndUpdate(data.flatId, {
        $set: {
          residingType: 'Vacant',
          modifiedOn: new Date(),
          modifiedByUserId: loggedInUserId
        }
      });
    }
  }

  return member;
};

export const updateFlatMember = async (flatId, flatMemberId) => {
  const flat = await Flat.findById(flatId);
  if (!flat) return;

  flat.flatMemberId = flatMemberId;
  await Flat.findByIdAndUpdate({ _id: flatId }, flat, { new: true });
};
