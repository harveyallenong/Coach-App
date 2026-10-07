/** The authenticated principal every service receives as its first argument. */
export type Actor = {
  userId: string;
  email: string;
  name: string | null;
  timezone: string;
  isAdmin: boolean;
  /** CoachProfile.id when the user is a coach. */
  coachId: string | null;
  /** ClientProfile.id when the user is a client. */
  clientId: string | null;
};
