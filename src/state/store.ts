import { Sync } from '../features/sync/sync';
import type { AppState } from '../types/index';

export function blank(): AppState {
  return {
    profile: { code: '', name: '', cls: '', role: 'student', approved: false },
    assessments: [], programs: [], posts: [], audio: [], reminder: false
  };
}
export let S: AppState = blank();
export function setS(next: AppState) { S = next; }
export function save() { Sync.changed(); }
