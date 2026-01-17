export const getISTDayRange = (dateInput = new Date()) => {
  // IST is UTC+5:30 (330 minutes ahead)
  const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes
  
  // Parse the UTC date
  const utcDate = new Date(dateInput);
  
  // Convert UTC to IST by adding 5:30 hours
  const istDate = new Date(utcDate.getTime() + (IST_OFFSET_MINUTES * 60 * 1000));
  
  // Get start of day in IST (00:00:00 IST)
  const startOfDayIST = new Date(istDate);
  startOfDayIST.setUTCHours(0, 0, 0, 0);
  
  // Get end of day in IST (23:59:59.999 IST)
  const endOfDayIST = new Date(istDate);
  endOfDayIST.setUTCHours(23, 59, 59, 999);
  
  // Convert IST times back to UTC by subtracting 5:30 hours
  const startUTC = new Date(startOfDayIST.getTime() - (IST_OFFSET_MINUTES * 60 * 1000));
  const endUTC = new Date(endOfDayIST.getTime() - (IST_OFFSET_MINUTES * 60 * 1000));
  
  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString()
  };
};
