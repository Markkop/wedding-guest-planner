import type { Guest } from "@/lib/types";

const LISTED_OR_DECLINED_STAGE_IDS = new Set(["listed", "declined"]);

export function findFirstListedOrDeclinedIndex(guests: Guest[]): number {
  return guests.findIndex((guest) =>
    LISTED_OR_DECLINED_STAGE_IDS.has(guest.confirmation_stage)
  );
}

export function canMoveGuestAboveListedDeclined(
  guests: Guest[],
  guestId: string
): boolean {
  const boundaryIndex = findFirstListedOrDeclinedIndex(guests);
  if (boundaryIndex === -1) return false;

  const guestIndex = guests.findIndex((guest) => guest.id === guestId);
  if (guestIndex === -1) return false;

  return guestIndex > boundaryIndex;
}

export function moveGuestAboveListedDeclined(
  guests: Guest[],
  guestId: string
): Guest[] | null {
  const boundaryIndex = findFirstListedOrDeclinedIndex(guests);
  const guestIndex = guests.findIndex((guest) => guest.id === guestId);

  if (boundaryIndex === -1 || guestIndex === -1 || guestIndex <= boundaryIndex) {
    return null;
  }

  const guestToMove = guests[guestIndex];
  const reorderedGuests = [
    ...guests.slice(0, guestIndex),
    ...guests.slice(guestIndex + 1),
  ];

  reorderedGuests.splice(boundaryIndex, 0, guestToMove);
  return reorderedGuests;
}
