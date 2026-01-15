export const getISTDayRange = (dateInput = new Date()) => {
  const date = new Date(dateInput);

  console.log('date = ', date);
  // Start of day IST
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  // End of day IST
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};
