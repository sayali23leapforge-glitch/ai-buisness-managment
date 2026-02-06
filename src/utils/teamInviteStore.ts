import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  inviteLink: string;
  createdAt: Timestamp;
  createdBy?: string;
}

// Create a new team invite
export const createTeamInvite = async (
  email: string,
  role: string,
  inviteLink: string,
  createdBy?: string
): Promise<{ success: boolean; inviteId?: string; message: string }> => {
  try {
    const invitesCollection = collection(db, 'teamInvites');

    const docRef = await addDoc(invitesCollection, {
      email,
      role,
      status: 'pending',
      inviteLink,
      createdAt: Timestamp.now(),
      createdBy: createdBy || 'admin',
    });

    return {
      success: true,
      inviteId: docRef.id,
      message: 'Invite created successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create invite'
    };
  }
};

// Get invite by ID
export const getInviteById = async (inviteId: string): Promise<TeamInvite | null> => {
  try {
    const inviteDoc = await getDoc(doc(db, 'teamInvites', inviteId));

    if (inviteDoc.exists()) {
      return {
        id: inviteDoc.id,
        ...inviteDoc.data(),
      } as TeamInvite;
    }

    return null;
  } catch (error) {
    console.error('Error getting invite:', error);
    return null;
  }
};

// Update invite status
export const updateInviteStatus = async (
  inviteId: string,
  status: 'accepted' | 'rejected'
): Promise<{ success: boolean; message: string }> => {
  try {
    const inviteDoc = doc(db, 'teamInvites', inviteId);
    await updateDoc(inviteDoc, {
      status
    });

    return {
      success: true,
      message: `Invite ${status} successfully`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to update invite'
    };
  }
};

// Get all invites for a user
export const getUserInvites = async (email: string): Promise<TeamInvite[]> => {
  try {
    const invitesCollection = collection(db, 'teamInvites');
    const q = query(invitesCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TeamInvite));
  } catch (error) {
    console.error('Error getting user invites:', error);
    return [];
  }
};

// Get all team invites with real-time listener
export const subscribeToTeamInvites = (
  callback: (invites: TeamInvite[]) => void,
  constraints?: QueryConstraint[]
) => {
  try {
    const invitesCollection = collection(db, 'teamInvites');
    const q = constraints 
      ? query(invitesCollection, ...constraints)
      : query(invitesCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const invites = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as TeamInvite));

      callback(invites);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to invites:', error);
    return () => {};
  }
};

// Delete a team invite
export const deleteTeamInvite = async (
  inviteId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const inviteDoc = doc(db, 'teamInvites', inviteId);
    await deleteDoc(inviteDoc);

    return {
      success: true,
      message: 'Invite deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to delete invite'
    };
  }
};