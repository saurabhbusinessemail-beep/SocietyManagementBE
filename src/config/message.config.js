export const OTP = {
    type: 'OTP',
    title: 'OTP Verification',
    message: (otp) => `Your one-time verification code is: ${otp}. If you did not request this code, please ignore this message or contact our support team immediately.`
}

export const GATE_ENTRY_REQUEST = {
    type: 'GATE_PASS',
    title: 'Gate Entry Request',
    message: (gateEntry) => `${gateEntry.visitorName} is requesting for gate entry` + (gateEntry.purpose ? ` for ${gateEntry.purpose}` : '.')
}

export const GATE_ENTRY_RESPONSE = {
    type: 'GATE_PASS_RESPONSE',
    title: 'Gate Entry Response',
    message: (gateEntry) => `Flat member has ${gateEntry.status} gate entry request for ${gateEntry.visitorName}.`
}

export const GATE_ENTERED = {
    type: 'GENERAL',
    title: 'Gate Entry Request',
    message: (gateEntry) => `${gateEntry.visitorName} has entered premises.`
}

export const GATE_EXITED = {
    type: 'GATE_EXIT',
    title: 'Gate Exit',
    message: (gateEntry) => `${gateEntry.visitorName} has exited the premises.`
}

export const SOCIETY_APPROVED = {
    type: 'GENERAL',
    title: 'Society Approved',
    message: (society) => `Society ${society.societyName} has been approved. You and others can now start adding themselves as Flat Owner, Tenant or Security. You are the society admin of this society.`
}

export const SOCIETY_REJECTED = {
    type: 'GENERAL',
    title: 'Society Rejected',
    message: (society) => `Society ${society.societyName} has been rejected. Please contact admin to get more info on this.`
}
