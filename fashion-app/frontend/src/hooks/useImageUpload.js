import { useCallback } from 'react';
import { processUpload } from '../utils/imageProcessor.js';

export function useImageUpload(dispatch) {
  const upload = useCallback(
    async (field, file) => {
      try {
        const dataUrl = await processUpload(file);
        dispatch({ type: 'SET_INPUT', field, value: dataUrl });
        return null;
      } catch (e) {
        return e.message;
      }
    },
    [dispatch]
  );

  const clear = useCallback(
    (field) => dispatch({ type: 'SET_INPUT', field, value: null }),
    [dispatch]
  );

  return { upload, clear };
}
