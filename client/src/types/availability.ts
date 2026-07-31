export type SlotStatus = 'available' | 'selected' | 'occupied' | 'past' | 'unavailable';
export type SlotPeriod = 'morning' | 'afternoon' | 'evening';

export type AvailabilitySlot = {
  time: string;
  endTime: string;
  status: Exclude<SlotStatus, 'selected'>;
  period: SlotPeriod;
  reason: string | null;
  requiredSlots: string[];
};

export type AvailabilityResponse = {
  date: string;
  serviceId: string;
  slots: AvailabilitySlot[];
  grouped: Record<SlotPeriod, AvailabilitySlot[]>;
  nextAvailableDate: string | null;
};
