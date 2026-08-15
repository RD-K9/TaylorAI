import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fingerprint,
  listGarments,
  listPeople,
  removeGarment as dbRemoveGarment,
  removePerson as dbRemovePerson,
  saveGarment as dbSaveGarment,
  savePerson as dbSavePerson,
  type WardrobeGarment,
  type WardrobePerson,
} from "@/lib/wardrobeDb";

export function useWardrobe() {
  const [people, setPeople] = useState<WardrobePerson[]>([]);
  const [garments, setGarments] = useState<WardrobeGarment[]>([]);
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
    async (dataUrl: string, label?: string) => {
      const row = await dbSavePerson(dataUrl, label);
      await refresh();
      return row;
    },
    [refresh]
  );

  const saveGarment = useCallback(
    async (input: {
      imageBase64: string;
      source: "generated" | "uploaded";
      prompt?: string;
      label?: string;
    }) => {
      const row = await dbSaveGarment(input);
      await refresh();
      return row;
    },
    [refresh]
  );

  const removePerson = useCallback(
    async (id: string) => {
      await dbRemovePerson(id);
      await refresh();
    },
    [refresh]
  );

  const removeGarment = useCallback(
    async (id: string) => {
      await dbRemoveGarment(id);
      await refresh();
    },
    [refresh]
  );

  const personFingerprints = useMemo(
    () => new Set(people.map((p) => p.fingerprint)),
    [people]
  );
  const garmentFingerprints = useMemo(
    () => new Set(garments.map((g) => g.fingerprint)),
    [garments]
  );

  const isPersonSaved = useCallback(
    (dataUrl: string | null | undefined) =>
      Boolean(dataUrl && personFingerprints.has(fingerprint(dataUrl))),
    [personFingerprints]
  );

  const isGarmentSaved = useCallback(
    (imageBase64: string | null | undefined) =>
      Boolean(imageBase64 && garmentFingerprints.has(fingerprint(imageBase64))),
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
