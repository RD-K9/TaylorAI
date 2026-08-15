export const initialState = {
  step: 'input',
  inputs: {
    personImage: null,
    fabricImage: null,
    referenceImage: null,
    bodyMeasurements: { height: '', bust: '', waist: '', hips: '' },
  },
  filters: {
    season: '',
    bodyType: '',
    bodyShape: '',
    clothesType: '',
    occasion: '',
    stylePref: '',
    budget: '',
    region: '',
    fitPref: '',
  },
  generateCount: 1,
  fabricValidation: null,
  garments: [],
  selectedGarmentId: null,
  tryOn: { result: null, status: 'idle', error: null },
  generate: { count: 1, current: 0, status: 'idle', pendingCount: null },
  ui: { error: null, toast: null, showRemixModal: false, remixTargetId: null },
};

export function fashionReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return {
        ...state,
        inputs: { ...state.inputs, [action.field]: action.value },
      };
    case 'SET_MEASUREMENT':
      return {
        ...state,
        inputs: {
          ...state.inputs,
          bodyMeasurements: { ...state.inputs.bodyMeasurements, [action.field]: action.value },
        },
      };
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.field]: action.value },
      };
    case 'SET_GENERATE_COUNT':
      return { ...state, generateCount: action.value };
    case 'SET_STEP':
      return { ...state, step: action.value };
    case 'SET_FABRIC_VALIDATION':
      return { ...state, fabricValidation: action.value };
    case 'GENERATE_START':
      return {
        ...state,
        step: 'processing',
        generate: {
          count: action.count,
          current: 0,
          status: action.phase || 'validating',
          pendingCount: action.phase === 'generating' ? null : state.generate.pendingCount,
        },
        ui: { ...state.ui, error: null },
        garments: action.reset ? [] : state.garments,
      };
    case 'GENERATE_PROGRESS':
      return {
        ...state,
        generate: { ...state.generate, current: action.current, status: 'generating' },
      };
    case 'GENERATE_SUCCESS':
      return {
        ...state,
        garments: [...state.garments, action.garment],
        generate: { ...state.generate, current: action.current },
      };
    case 'GENERATE_DONE':
      return {
        ...state,
        step: 'preview',
        generate: { ...state.generate, status: 'done', pendingCount: null },
        selectedGarmentId: action.selectedId || state.garments[0]?.id || null,
      };
    case 'GENERATE_AWAIT_FABRIC':
      return {
        ...state,
        step: 'processing',
        generate: {
          count: action.count,
          current: 0,
          status: 'awaiting_fabric_confirm',
          pendingCount: action.count,
        },
        ui: { ...state.ui, error: null },
        garments: [],
      };
    case 'GENERATE_ERROR':
      return {
        ...state,
        generate: { count: 1, current: 0, status: 'idle', pendingCount: null },
        step: 'input',
        ui: { ...state.ui, error: action.message },
      };
    case 'SELECT_GARMENT':
      return {
        ...state,
        selectedGarmentId: action.id,
        step: action.id ? 'feedback' : state.step,
      };
    case 'SET_FEEDBACK':
      return {
        ...state,
        garments: state.garments.map((g) =>
          g.id === action.id ? { ...g, feedback: action.feedback } : g
        ),
      };
    case 'REMOVE_GARMENT':
      return {
        ...state,
        garments: state.garments.filter((g) => g.id !== action.id),
        selectedGarmentId: state.selectedGarmentId === action.id ? null : state.selectedGarmentId,
      };
    case 'REPLACE_GARMENT':
      return {
        ...state,
        garments: state.garments.map((g) => (g.id === action.id ? action.garment : g)),
      };
    case 'ADD_GARMENT': {
      const exists = state.garments.some((g) => g.id === action.garment.id);
      return {
        ...state,
        garments: exists ? state.garments : [...state.garments, action.garment],
        selectedGarmentId: action.garment.id,
      };
    }
    case 'TRYON_START':
      return {
        ...state,
        step: 'tryon',
        tryOn: { result: null, status: 'loading', error: null },
      };
    case 'TRYON_SUCCESS':
      return {
        ...state,
        step: 'done',
        tryOn: { result: action.result, status: 'success', error: null },
      };
    case 'TRYON_ERROR':
      return {
        ...state,
        tryOn: { result: null, status: 'error', error: action.message },
      };
    case 'SET_TOAST':
      return { ...state, ui: { ...state.ui, toast: action.message } };
    case 'CLEAR_TOAST':
      return { ...state, ui: { ...state.ui, toast: null } };
    case 'SET_REMIX_MODAL':
      return {
        ...state,
        ui: { ...state.ui, showRemixModal: action.show, remixTargetId: action.id || null },
      };
    case 'RESTORE_DRAFT':
      return { ...state, filters: action.filters, generateCount: action.generateCount || 1 };
    default:
      return state;
  }
}
