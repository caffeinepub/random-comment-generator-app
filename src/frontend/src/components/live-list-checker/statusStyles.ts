import type { ClaimStatus } from '../../types/liveListChecker';

export interface StatusStyle {
  label: string;
  className: string;
}

export const statusStyles: Record<ClaimStatus | 'available' | 'taken', StatusStyle> = {
  available: {
    label: 'Available',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  },
  approved: {
    label: 'Approved',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700',
  },
  taken: {
    label: 'Taken',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  },
};

export function getStatusStyle(status: ClaimStatus | 'available' | 'taken'): StatusStyle {
  return statusStyles[status] || statusStyles.available;
}
