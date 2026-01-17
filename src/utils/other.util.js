export const getISTDayRange = (dateInput = new Date()) => {
  // IST is UTC+5:30
  const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

  // Create date at 00:00:00 IST
  const startOfDayIST = new Date(dateInput);
  startOfDayIST.setHours(0, 0, 0, 0);

  // Create date at 23:59:59.999 IST
  const endOfDayIST = new Date(dateInput);
  endOfDayIST.setHours(23, 59, 59, 999);

  // Convert to UTC
  const startUTC = new Date(startOfDayIST.getTime() - IST_OFFSET);
  const endUTC = new Date(endOfDayIST.getTime() - IST_OFFSET);

  return {
    start: startUTC.toISOString(), // 2026-01-16T18:30:00.000Z
    end: endUTC.toISOString() // 2026-01-17T18:29:59.999Z
  };
};
