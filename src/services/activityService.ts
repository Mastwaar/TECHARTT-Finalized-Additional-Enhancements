import { useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export const trackActivity = async (data: {
  product_id: string;
  activity_type: 'view' | 'click' | 'dwell';
  value?: number;
  metadata?: any;
}) => {
  const path = 'activities';
  try {
    const activityRef = collection(db, path);
    await addDoc(activityRef, {
      ...data,
      user_id: auth.currentUser?.uid || null,
      session_id: sessionStorage.getItem('aura_session_id') || 'unkn_' + Math.random().toString(36).substring(2, 7),
      timestamp: serverTimestamp(),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};


export const useActivityLogger = (productId: string, enabled: boolean = true) => {
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;
    
    // Ensure we have a session ID
    if (!sessionStorage.getItem('aura_session_id')) {
      sessionStorage.setItem('aura_session_id', 'sess_' + Math.random().toString(36).substring(2, 15));
    }

    // Track View
    trackActivity({
      product_id: productId,
      activity_type: 'view',
      value: 1
    });

    return () => {
      // Track Dwell time on unmount
      const duration = Date.now() - startTime.current;
      if (duration > 1000) { // Only log if > 1s
        trackActivity({
          product_id: productId,
          activity_type: 'dwell',
          value: duration
        });
      }
    };
  }, [productId, enabled]);

  const recordClick = (metadata?: any) => {
    if (!enabled) return;
    trackActivity({
      product_id: productId,
      activity_type: 'click',
      value: 1,
      metadata
    });
  };

  return { recordClick };
};
