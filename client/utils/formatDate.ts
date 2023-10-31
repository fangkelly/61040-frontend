import moment from "moment";
/**
 * Encode a date as an unambiguous string
 *
 * @param {Date} date - A date object
 * @returns {string} - formatted date as string
 */
export const formatDate = (date: Date): string => moment(date).format("MMMM Do YYYY, h:mm:ss a");

export const abbreviateMonth = (month: number): string | undefined => {
  const monthMap = new Map<number, string>([
    [1, "Jan"],
    [2, "Feb"],
    [3, "Mar"],
    [4, "Apr"],
    [5, "May"],
    [6, "Jun"],
    [7, "Jul"],
    [8, "Aug"],
    [9, "Sep"],
    [10, "Oct"],
    [11, "Nov"],
    [12, "Dec"],
  ]);

  return monthMap.get(month);
};

export const formatTime = (hour: string, minute: string, am: boolean): string => {
  if (am) {
    return `${hour}:${minute} AM`;
  }
  return `${hour}:${minute} PM`;
};

export type dateTime = { time: { hour: string; minute: string; am: string }; date: { month: string; year: string; date: string } };

const sortDateTime = (d1: Required<dateTime>, d2: Required<dateTime>): number => {
  // convert to Date objects
  const dateObj1 = d1.date;
  const timeObj1 = d1.time;
  let hour1 = parseInt(timeObj1.hour);
  if (!timeObj1.am) hour1 += 12;
  const convertedDate1 = new Date(parseInt(dateObj1.year), parseInt(dateObj1.month) - 1, parseInt(dateObj1.date), hour1, parseInt(timeObj1.minute), 0, 0);

  const dateObj2 = d2.date;
  const timeObj2 = d2.time;
  let hour2 = parseInt(timeObj2.hour);
  if (!timeObj2.am) hour2 += 12;
  const convertedDate2 = new Date(parseInt(dateObj2.year), parseInt(dateObj2.month) - 1, parseInt(dateObj2.date), hour2, parseInt(timeObj2.minute), 0, 0);

  if (convertedDate1 > convertedDate2) {
    return 1;
  }
  return -1;
};

export const sortAscendingDateTime = (dateTimes: Array<Required<dateTime>>): Array<Required<dateTime>> => {
  const sortedDateTimes = dateTimes.sort(sortDateTime);
  return sortedDateTimes;
};

export const filterFutureDateTime = (dateTimes: Array<Required<dateTime>>): Array<Required<dateTime>> => {
  const currentDate = new Date();
  const futureDatetimes = dateTimes.filter((dt) => {
    const dateObj = dt.date;
    const timeObj = dt.time;
    let hour = parseInt(timeObj.hour);
    if (!timeObj.am) hour += 12;
    const convertedDate = new Date(parseInt(dateObj.year), parseInt(dateObj.month) - 1, parseInt(dateObj.date), hour, parseInt(timeObj.minute), 0, 0);

    return convertedDate >= currentDate;
  });

  return futureDatetimes;
};
