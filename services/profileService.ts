import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types';
const KEY='heycoach_profile_v1';
export async function fetchProfile(userId:string):Promise<UserProfile|null>{ try { const raw=await AsyncStorage.getItem(KEY); return raw?JSON.parse(raw):{id:userId,email:null,username:'Owner',activePersonaId:'coach_core',intensity:3}; } catch{return null;} }
export async function updateProfile(userId:string,updates:Partial<{activePersonaId:string;intensity:number}>){ const current=(await fetchProfile(userId))||{id:userId,email:null,username:'Owner',activePersonaId:'coach_core',intensity:3}; await AsyncStorage.setItem(KEY,JSON.stringify({...current,...updates})); }
