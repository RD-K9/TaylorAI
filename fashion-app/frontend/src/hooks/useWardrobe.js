import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fingerprint,
  listGarments,
  listPeople,
  removeGarment as dbRemoveGarment,
  removePerson as dbRemovePerson,
  saveGarment as dbSaveGarment,
  savePerson as dbSavePerson,
} from '../utils/wardrobeDb.js';

export function useWardrobe() {
  const [people, setPeople] = useState([]);
  const [garments, setGarments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [p, g] = await Promise.all([listPeople(), listGarments()]);
    setPeople(p);
    setGarments(g);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, g] = await Promise.all([listPeople(), listGarments()]);
        if (!cancelled) {
          setPeople(p);
          setGarments(g);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const savePerson = useCallback(
    async (dataUrl, label) => {
      const row = await dbSavePerson(dataUrl, label);
      await refresh();
      return row;
    },
    [refresh]
  );

  const saveGarment = useCallback(
    async (input) => {
      const row = await dbSaveGarment(input);
      await refresh();
      return row;
    },
    [refresh]
  );

  const removePerson = useCallback(
    async (id) => {
      await dbRemovePerson(id);
      await refresh();
    },
    [refresh]
  );

  const removeGarment = useCallback(
    async (id) => {
      await dbRemoveGarment(id);
      await refresh();
    },
    [refresh]
  );

  const personFingerprints = useMemo(() => new Set(people.map((p) => p.fingerprint)), [people]);
  const garmentFingerprints = useMemo(
    () => new Set(garments.map((g) => g.fingerprint)),
    [garments]
  );

  const isPersonSaved = useCallback(
    (dataUrl) => Boolean(dataUrl && personFingerprints.has(fingerprint(dataUrl))),
    [personFingerprints]
  );

  const isGarmentSaved = useCallback(
    (imageBase64) => Boolean(imageBase64 && garmentFingerprints.has(fingerprint(imageBase64))),
    [garmentFingerprints]
  );

  return {
    people,
    garments,
    loading,
    refresh,
    savePerson,
    saveGarment,
    removePerson,
    removeGarment,
    isPersonSaved,
    isGarmentSaved,
  };
}
