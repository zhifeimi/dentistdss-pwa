import api from '../../services';
import { formatDate, type AvailabilitySlot } from './scheduleUtils';

/**
 * Schedule API functions
 * Extracted to follow Single Responsibility Principle
 */

export interface User {
  id: string | number;
  clinicId?: string | number;
}

/**
 * Load availability data for date range
 */
export const loadAvailabilityData = async (
  user: User,
  startDate: string,
  endDate: string
): Promise<AvailabilitySlot[]> => {
  if (!user?.id || user?.clinicId === undefined) {
    throw new Error('User information not available');
  }

  const data = await api.clinic.getDentistAvailability(
    Number(user.id),
    startDate,
    endDate
  );

  // Normalize the API response
  const availabilityData = Array.isArray(data) ? data : (data as any)?.dataObject || (data as any)?.data || [];
  return availabilityData.map((item: any) => ({
    ...item,
    isBlocked: item.isBlocked || false,
    isActive: item.isActive !== false
  }));
};

/**
 * Create new availability slot
 */
export const createAvailabilitySlot = async (
  user: User,
  availabilityData: Partial<AvailabilitySlot>
): Promise<AvailabilitySlot> => {
  if (!user?.id || user?.clinicId === undefined) {
    throw new Error('User information not available');
  }

  const result = await api.clinic.createAvailability({
    ...availabilityData,
    dentistId: Number(user.id),
    clinicId: Number(user.clinicId),
    dayOfWeek: availabilityData.dayOfWeek || 0,
    startTime: availabilityData.startTime || '09:00',
    endTime: availabilityData.endTime || '17:00',
    isRecurring: availabilityData.isRecurring || false,
    effectiveFrom: availabilityData.effectiveFrom || formatDate(new Date()),
    effectiveUntil: availabilityData.effectiveUntil || formatDate(new Date())
  });

  return {
    ...result,
    isBlocked: (result as any).isBlocked || false,
    isActive: (result as any).isActive !== false
  };
};

/**
 * Block availability slot
 */
export const blockAvailabilitySlot = async (
  slotId: string | number,
  reason: string
): Promise<void> => {
  await api.clinic.blockAvailabilitySlot(Number(slotId), reason);
};

/**
 * Unblock availability slot
 */
export const unblockAvailabilitySlot = async (
  slotId: string | number
): Promise<void> => {
  await api.clinic.unblockAvailabilitySlot(Number(slotId));
};

/**
 * Delete availability slot
 */
export const deleteAvailabilitySlot = async (
  slotId: string | number
): Promise<void> => {
  await api.clinic.deleteAvailabilitySlot(Number(slotId));
};
