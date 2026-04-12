import { Flat, FlatMember } from '../models';
import { moveInTenant, getCurrentResidingType } from '../services/flat.service';

export const creatFlatMember = async (data, loggedInUserId) => {

  // Create the flat member record
  const member = await FlatMember.create(data);

  // Only apply special logic for tenants
  if (data.isTenant && data.leaseStart) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaseStart = new Date(data.leaseStart);
    const leaseEnd = data.leaseEnd ? new Date(data.leaseEnd) : undefined;
    leaseStart.setHours(0, 0, 0, 0);
    if (leaseEnd) leaseEnd.setHours(0, 0, 0, 0);

    const currentResidingType = await getCurrentResidingType(data.flatId);

    if (today >= leaseStart && (!leaseEnd || today <= leaseEnd)) {
      // Today is within lease → vacate existing occupants
      await moveInTenant(member._id, loggedInUserId, leaseStart);
      // The new member's residingType stays as 'Tenant' (already in data)
    } else {
      // Today is outside lease → no vacating; set new member's residingType to the current flat's residing type
      data.residingType = currentResidingType;
      // TODO: Schedule activation for lease start (e.g., job queue)
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
