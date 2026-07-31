import { Calendar } from './Calendar';

type DateStepProps = {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export function DateStep({ selectedDate, onSelectDate }: DateStepProps) {
  return (
    <div className="step-panel">
      <h3>Escolha a data</h3>
      <Calendar selectedDate={selectedDate} onSelectDate={onSelectDate} />
    </div>
  );
}
