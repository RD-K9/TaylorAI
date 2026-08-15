import { useCallback } from 'react';
import { generateGarment, tryOn, validateFabric } from '../api/fashionApi.js';
import { STYLE_ROTATION, SEASONS, BODY_TYPES, CLOTHES_TYPES } from '../constants/filters.js';
import { base64ToObjectUrl, stripBase64Prefix } from '../utils/base64.js';

function buildContext(inputs) {
  const m = inputs.bodyMeasurements || {};
  const measurements = {};
  if (m.height) measurements.height = Number(m.height);
  if (m.bust) measurements.bust = Number(m.bust);
  if (m.waist) measurements.waist = Number(m.waist);
  if (m.hips) measurements.hips = Number(m.hips);

  return {
    personImageBase64: inputs.personImage,
    fabricImageBase64: inputs.fabricImage || undefined,
    referenceImageBase64: inputs.referenceImage || undefined,
    bodyMeasurements: Object.keys(measurements).length ? measurements : undefined,
  };
}

function validateRequired(state) {
  if (!state.inputs.personImage) return 'Vui lòng upload ảnh người.';
  if (!state.filters.season) return 'Vui lòng chọn mùa.';
  if (!state.filters.clothesType) return 'Vui lòng chọn loại quần áo.';
  return null;
}

export function useFashionPipeline(state, dispatch) {
  const runGenerateLoop = useCallback(
    async (count) => {
      dispatch({ type: 'GENERATE_START', count, reset: true, phase: 'generating' });
      const context = buildContext(state.inputs);
      let firstGarmentId = null;

      for (let i = 0; i < count; i += 1) {
        dispatch({ type: 'GENERATE_PROGRESS', current: i + 1 });
        const seed = Date.now() + i * 997;
        const result = await generateGarment({
          filters: state.filters,
          context,
          options: { seed, width: 1024, height: 1024 },
        });
        const garmentId = `g-${Date.now()}-${i}`;
        if (!firstGarmentId) firstGarmentId = garmentId;
        const imageUrl = base64ToObjectUrl(result.image);
        dispatch({
          type: 'GENERATE_SUCCESS',
          current: i + 1,
          garment: {
            id: garmentId,
            imageUrl,
            imageBase64: result.image,
            prompt: result.prompt,
            seed: result.seed,
            stylePref: state.filters.stylePref,
            budget: state.filters.budget,
            feedback: null,
            source: 'generated',
          },
        });
      }

      dispatch({ type: 'GENERATE_DONE', selectedId: firstGarmentId });
      dispatch({ type: 'SET_TOAST', message: `Đã tạo ${count} gợi ý quần áo.` });
    },
    [state.inputs, state.filters, dispatch]
  );

  const startGenerate = useCallback(async () => {
    const err = validateRequired(state);
    if (err) {
      dispatch({ type: 'GENERATE_ERROR', message: err });
      return;
    }

    const count = state.generateCount || 1;
    dispatch({ type: 'GENERATE_START', count, reset: true, phase: 'validating' });

    try {
      if (state.inputs.fabricImage) {
        const validation = await validateFabric({
          fabricImageBase64: stripBase64Prefix(state.inputs.fabricImage),
          clothesType: state.filters.clothesType,
          season: state.filters.season,
          occasion: state.filters.occasion,
        });
        dispatch({ type: 'SET_FABRIC_VALIDATION', value: validation });

        if (!validation.compatible) {
          dispatch({ type: 'GENERATE_AWAIT_FABRIC', count });
          return;
        }
      } else {
        dispatch({ type: 'SET_FABRIC_VALIDATION', value: null });
      }

      await runGenerateLoop(count);
    } catch (e) {
      dispatch({ type: 'GENERATE_ERROR', message: e.message });
    }
  }, [state, dispatch, runGenerateLoop]);

  const continueAfterFabricWarning = useCallback(async () => {
    const count = state.generate.pendingCount || state.generateCount || 1;
    dispatch({ type: 'SET_FABRIC_VALIDATION', value: null });
    try {
      await runGenerateLoop(count);
    } catch (e) {
      dispatch({ type: 'GENERATE_ERROR', message: e.message });
    }
  }, [state.generate.pendingCount, state.generateCount, dispatch, runGenerateLoop]);

  const remixGarment = useCallback(
    async (garmentId, fieldsToChange = {}) => {
      const garment = state.garments.find((g) => g.id === garmentId);
      if (!garment) return;

      const newFilters = { ...state.filters, ...fieldsToChange };

      if (fieldsToChange.autoStyle) {
        const idx = STYLE_ROTATION.indexOf(newFilters.stylePref || '');
        newFilters.stylePref = STYLE_ROTATION[(idx + 1) % STYLE_ROTATION.length];
        delete newFilters.autoStyle;
      }

      Object.entries(fieldsToChange).forEach(([k, v]) => {
        if (k !== 'autoStyle') dispatch({ type: 'SET_FILTER', field: k, value: v });
      });
      if (fieldsToChange.autoStyle) {
        dispatch({ type: 'SET_FILTER', field: 'stylePref', value: newFilters.stylePref });
      }

      dispatch({ type: 'GENERATE_START', count: 1, reset: false, phase: 'generating' });

      try {
        const context = buildContext(state.inputs);
        const result = await generateGarment({
          filters: newFilters,
          context,
          options: { seed: Date.now(), width: 1024, height: 1024 },
        });

        const imageUrl = base64ToObjectUrl(result.image);
        dispatch({
          type: 'REPLACE_GARMENT',
          id: garmentId,
          garment: {
            ...garment,
            imageUrl,
            imageBase64: result.image,
            prompt: result.prompt,
            seed: result.seed,
            stylePref: newFilters.stylePref,
            budget: newFilters.budget,
            feedback: null,
            source: 'generated',
          },
        });
        dispatch({ type: 'GENERATE_DONE' });
        dispatch({ type: 'SET_STEP', value: 'preview' });
        dispatch({ type: 'SET_TOAST', message: 'Đã remix style mới.' });
      } catch (e) {
        dispatch({ type: 'GENERATE_ERROR', message: e.message });
      }
    },
    [state, dispatch]
  );

  const autoRemix = useCallback(
    (garmentId) => {
      const rotations = [
        () => {
          const i = SEASONS.indexOf(state.filters.season);
          return { season: SEASONS[(i + 1) % SEASONS.length] };
        },
        () => {
          const i = BODY_TYPES.indexOf(state.filters.bodyType);
          return { bodyType: BODY_TYPES[(i + 1) % BODY_TYPES.length] || BODY_TYPES[0] };
        },
        () => {
          const i = CLOTHES_TYPES.indexOf(state.filters.clothesType);
          return { clothesType: CLOTHES_TYPES[(i + 1) % CLOTHES_TYPES.length] };
        },
        () => ({ autoStyle: true }),
        () => {
          const opts = ['', 'Low', 'Mid', 'High'];
          const i = opts.indexOf(state.filters.budget);
          return { budget: opts[(i + 1) % opts.length] };
        },
      ];
      const pick = rotations[Math.floor(Math.random() * rotations.length)]();
      return remixGarment(garmentId, pick);
    },
    [state.filters, remixGarment]
  );

  const handleTryOn = useCallback(async () => {
    const garment = state.garments.find((g) => g.id === state.selectedGarmentId);
    if (!garment || !state.inputs.personImage) {
      dispatch({ type: 'TRYON_ERROR', message: 'Chọn quần áo và upload ảnh người.' });
      return;
    }
    dispatch({ type: 'TRYON_START' });
    try {
      const result = await tryOn(
        stripBase64Prefix(state.inputs.personImage),
        garment.imageBase64
      );
      const url = base64ToObjectUrl(result.image);
      dispatch({ type: 'TRYON_SUCCESS', result: { url, base64: result.image } });
    } catch (e) {
      dispatch({ type: 'TRYON_ERROR', message: e.message });
    }
  }, [state, dispatch]);

  return { startGenerate, continueAfterFabricWarning, remixGarment, autoRemix, handleTryOn };
}
