import type { AvailabilitySlot } from '../../types/availability';

type TimeSlotProps = {
  slot: AvailabilitySlot;
  selected: boolean;
  onSelect: (slot: AvailabilitySlot) => void;
};

export function TimeSlot({ slot, selected, onSelect }: TimeSlotProps) {
  const disabled = slot.status !== 'available';
  return (
    <button
      type="button"
      className={`time-slot ${selected ? 'is-selected' : ''} status-${slot.status}`}
      disabled={disabled}
      aria-selected={selected}
      onClick={() => onSelect(slot)}
    >
      <strong>{slot.time}</strong>
      <span>{disabled ? slot.reason || 'Indisponível' : 'Disponível'}</span>
    </button>
  );
}
