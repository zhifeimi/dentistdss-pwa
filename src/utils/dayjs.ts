import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

/**
 * Configured dayjs instance for the whole app.
 *
 * Import dayjs through this module (`import dayjs from '../utils/dayjs'`)
 * rather than from 'dayjs' directly so every consumer shares the same plugin
 * extensions:
 * - customParseFormat: strict parsing of API strings like 'HH:mm:ss' and
 *   'YYYY-MM-DD HH:mm:ss' (replaces moment(string, format)).
 * - isSameOrBefore / isSameOrAfter: calendar range checks (replaces the
 *   moment methods of the same name).
 */
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default dayjs;
export type { Dayjs } from 'dayjs';
