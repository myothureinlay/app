import type { Gender, PlanType, UserProfile } from '../types';

export const localProfileId = 'local-profile';

export const defaultUserProfile: UserProfile = {
  id: localProfileId,
  displayName: '',
  dateOfBirth: '',
  mobileNumber: '',
  gender: 'prefer_not_to_say',
  planType: 'free',
  profileImageUri: null,
  createdAt: '',
  updatedAt: '',
};

const genderOptions: Gender[] = ['male', 'female', 'other', 'prefer_not_to_say'];
const planOptions: PlanType[] = ['free', 'pro'];

function safeGender(value: unknown): Gender {
  return genderOptions.includes(value as Gender) ? (value as Gender) : defaultUserProfile.gender;
}

function safePlan(value: unknown): PlanType {
  return planOptions.includes(value as PlanType) ? (value as PlanType) : defaultUserProfile.planType;
}

export function normalizeUserProfile(profile?: Partial<UserProfile> | null): UserProfile {
  if (!profile) return defaultUserProfile;

  return {
    ...defaultUserProfile,
    ...profile,
    id: profile.id || localProfileId,
    displayName: profile.displayName?.trim() ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    mobileNumber: profile.mobileNumber?.trim() ?? '',
    gender: safeGender(profile.gender),
    planType: safePlan(profile.planType),
    profileImageUri: profile.profileImageUri || null,
    createdAt: profile.createdAt ?? '',
    updatedAt: profile.updatedAt ?? '',
  };
}

export function mergeUserProfile(current: UserProfile, patch: Partial<UserProfile>, timestamp: string): UserProfile {
  return normalizeUserProfile({
    ...current,
    ...patch,
    id: current.id || localProfileId,
    createdAt: current.createdAt || timestamp,
    updatedAt: timestamp,
  });
}
