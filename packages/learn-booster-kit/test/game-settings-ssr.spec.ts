import { expect, it } from 'vitest';
import { type } from 'arktype';
import { defineGameSettings } from '../src/lib/config/game-settings';
import { getProfilesState } from '../src/lib/config/profile-manager';

it('returns defaults during SSR without creating or sharing a profile', () => {
  const handle = defineGameSettings({ gameId: 'ssr', defaults: { value: 3 }, schema: type({ value: 'number' }),
    currentVersion: 1, migrate: d => d });
  expect(handle.get()).toEqual({ value: 3 });
  expect(handle.getOverride()).toEqual({});
  expect(getProfilesState().order).toEqual([]);
});
