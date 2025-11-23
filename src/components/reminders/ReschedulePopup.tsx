"use client";

interface Props {
  id: number;
  onClose: () => void;
  onConfirm: (id: number, newISO: string) => void;
  initialDate: string;
}

export default function ReschedulePopup({ id, onClose, onConfirm, initialDate }: Props) {
  return (
    <dialog id={`reschedule-dialog-${id}`} className="rounded-xl p-5 w-80">
      <h2 className="text-lg font-semibold mb-3">Reschedule Reminder</h2>

      <input
        id={`dt-${id}`}
        type="date"
        defaultValue={initialDate.slice(0, 16)}
        className="input w-full mb-4"
      />

      <div className="flex gap-3">
        <button onClick={onClose} className="btn bg-gray-300 text-black flex-1">
          Cancel
        </button>

        <button
          className="btn flex-1"
          onClick={() => {
            const val = (document.getElementById(`dt-${id}`) as HTMLInputElement).value;
            if (val) onConfirm(id, new Date(val).toISOString());
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </dialog>
  );
}
