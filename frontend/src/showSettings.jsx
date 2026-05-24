import React from 'react';
import { X } from 'lucide-react';

/**
 * SettingsModal
 * A minimalist modal dialog for deck settings actions.
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onRename: () => void,
 *   onEditDetails: () => void,
 *   onDelete: () => void
 * }} props
 */
export default function SettingsModal({ isOpen, onClose, onRename, onEditDetails, onDelete }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-black space-y-4 max-w-sm w-full">
            <h2 className="text-xl font-bold">Deck Settings</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={onRename}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Rename Deck
              </button>
              <button
                onClick={onEditDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Deck Details
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Deck
              </button>
            </div>
            <button
              onClick={() => onClose(false)}
              className="mt-4 w-full bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
  );
}
