import * as AuthService from '../services/auth.service';
import * as newUserService from '../services/newUser.service';
import * as UserService from '../services/user.service';
import * as SecurityService from '../services/security.service';
import { moveOutTenant, moveOutSelf } from '../services/flat.service';
import { FlatMember } from '../models';

export const newFlatMember = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let flatMember = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalise to start of day

    // --- Check for auto‑vacate only if today is within the lease period ---
    if (flatMember.isTenant && flatMember.leaseStart) {
      const leaseStart = new Date(flatMember.leaseStart);
      const leaseEnd = flatMember.leaseEnd ? new Date(flatMember.leaseEnd) : undefined;
      leaseStart.setHours(0, 0, 0, 0);
      if (leaseEnd) leaseEnd.setHours(0, 0, 0, 0);

      if (today >= leaseStart && (!leaseEnd || today <= leaseEnd)) {
        // Find the owner's record for the same flat
        const owner = await FlatMember.findOne({
          flatId: flatMember.flatId,
          isOwner: true
        });

        if (owner) {
          switch (owner.residingType) {
            case 'Self':
              await moveOutSelf(owner._id, today, user._id);
              break;
            case 'Tenant':
              await moveOutTenant(owner._id, today, user._id);
              break;
            case 'Vacant':
              // no action needed
              break;
          }
        }
      } else {
        console.log(`Lease period does not include today. Scheduling for later.`);
      }
    }

    // --- Create user if not registered ---
    if (!flatMember.userId) {
      const newUser = {
        phoneNumber: flatMember.contact,
        name: flatMember.name
      };
      const user = await UserService.findOrCreateUser(newUser);
      flatMember.userId = user._id;
    }

    // --- Create the new flat member ---
    const data = await newUserService.creatFlatMember(flatMember);
    await newUserService.updateFlatMember(flatMember.flatId, flatMember._id); // Update Flats table

    // --- Generate updated token and respond ---
    const updatedToken = await AuthService.getUserToken(user);
    res.status(201).json({
      success: true,
      message: 'Added Flat Member',
      token: updatedToken
    });
  } catch (err) {
    next(err);
  }
};

export const newSecurity = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let payload = req.body;
    payload.userId = user._id;

    SecurityService.addSecurity(payload);

    const updatedToken = await AuthService.getUserToken(user);
    res.status(201).json({
      success: true,
      message: 'Added Security',
      token: updatedToken
    });
  } catch (er) {
    next(err);
  }
};
