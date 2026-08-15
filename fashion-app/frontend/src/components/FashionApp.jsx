import { useCallback, useReducer, useState } from 'react';
import { useFashionPipeline } from '../hooks/useFashionPipeline.js';
import { useSessionDraft } from '../hooks/useSessionDraft.js';
import { useWardrobe } from '../hooks/useWardrobe.js';
import { fashionReducer, initialState } from '../state/fashionReducer.js';
import FilterSidebar from './FilterSidebar.jsx';
import GarmentPreview from './GarmentPreview.jsx';
import ImageUploader from './ImageUploader.jsx';
import TryOnResult from './TryOnResult.jsx';
import TryOnSetup from './TryOnSetup.jsx';
import FabricWarning from './ui/FabricWarning.jsx';
import LoadingOverlay from './ui/LoadingOverlay.jsx';
import RemixModal from './ui/RemixModal.jsx';
import StepIndicator from './ui/StepIndicator.jsx';
import TextureZoom from './ui/TextureZoom.jsx';
import Toast from './ui/Toast.jsx';
import WardrobePicker from './ui/WardrobePicker.jsx';

function garmentFromWardrobe(g) {
  return {
    id: `wardrobe-${g.id}`,
    imageUrl: `data:image/jpeg;base64,${g.imageBase64}`,
    imageBase64: g.imageBase64,
    prompt: g.prompt || '',
    seed: 0,
    stylePref: '',
    budget: '',
    feedback: null,
    source: 'wardrobe',
  };
}

function garmentFromUpload(dataUrl, base64) {
  return {
    id: `uploaded-${Date.now()}`,
    imageUrl: dataUrl,
    imageBase64: base64,
    prompt: '',
    seed: 0,
    stylePref: '',
    budget: '',
    feedback: null,
    source: 'uploaded',
  };
}

function SidebarContent({
  state,
  dispatch,
  startGenerate,
  canGenerate,
  generateTooltip,
  isLoading,
  onSavePerson,
  personSaved,
  onPickPerson,
}) {
  return (
    <>
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-3">Upload & Dáng người</h2>
        <ImageUploader
          inputs={state.inputs}
          dispatch={dispatch}
          onSavePerson={onSavePerson}
          personSaved={personSaved}
          onPickPerson={onPickPerson}
        />
      </section>
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-3">Bộ lọc</h2>
        <FilterSidebar
          filters={state.filters}
          generateCount={state.generateCount}
          dispatch={dispatch}
          onGenerate={startGenerate}
          canGenerate={canGenerate && !isLoading}
          tooltip={generateTooltip}
        />
      </section>
    </>
  );
}

export default function FashionApp() {
  const [state, dispatch] = useReducer(fashionReducer, initialState);
  const [zoomGarment, setZoomGarment] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [picker, setPicker] = useState({ open: false, mode: 'browse' });
  const wardrobe = useWardrobe();
  const { startGenerate, continueAfterFabricWarning, remixGarment, autoRemix, handleTryOn } =
    useFashionPipeline(state, dispatch);

  const onRestore = useCallback(
    (filters, generateCount) => dispatch({ type: 'RESTORE_DRAFT', filters, generateCount }),
    []
  );
  useSessionDraft(state.filters, state.generateCount, onRestore);

  const canGenerate = Boolean(
    state.inputs.personImage && state.filters.season && state.filters.clothesType
  );
  const generateTooltip = !state.inputs.personImage
    ? 'Cần upload ảnh người'
    : !state.filters.season
      ? 'Cần chọn mùa'
      : !state.filters.clothesType
        ? 'Cần chọn loại quần áo'
        : '';

  const isLoading =
    state.generate.status === 'validating' || state.generate.status === 'generating';
  const tryOnLoading = state.tryOn.status === 'loading';
  const selectedGarment = state.garments.find((g) => g.id === state.selectedGarmentId) || null;
  const showTryOnSetup =
    state.step === 'tryon' || (state.step === 'done' && !state.tryOn.result);

  const toastSave = async (action, okMessage) => {
    try {
      await action();
      dispatch({ type: 'SET_TOAST', message: okMessage });
    } catch (e) {
      dispatch({ type: 'SET_TOAST', message: e.message || 'Không lưu được' });
    }
  };

  const savePerson = () => {
    if (!state.inputs.personImage) return;
    void toastSave(() => wardrobe.savePerson(state.inputs.personImage), 'Đã lưu ảnh người');
  };

  const saveGarment = (garment) => {
    if (!garment) return;
    void toastSave(
      () =>
        wardrobe.saveGarment({
          imageBase64: garment.imageBase64,
          source: garment.source === 'uploaded' ? 'uploaded' : 'generated',
          prompt: garment.prompt,
        }),
      'Đã lưu quần áo vào tủ đồ'
    );
  };

  const goTryOnReady = () => dispatch({ type: 'SET_STEP', value: 'tryon' });

  const onGenerateClick = () => {
    setMobileOpen(false);
    startGenerate();
  };

  const personProps = {
    onSavePerson: savePerson,
    personSaved: wardrobe.isPersonSaved(state.inputs.personImage),
    onPickPerson: () => setPicker({ open: true, mode: 'person' }),
  };

  return (
    <div className="min-h-screen bg-fashion-surface font-[Inter,sans-serif] pb-20 lg:pb-0">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Thiết kế quần áo</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              onClick={() => setPicker({ open: true, mode: 'browse' })}
            >
              Tủ đồ
            </button>
            <button
              type="button"
              className="px-3 py-2 text-sm border border-pink-200 text-pink-700 rounded-lg bg-pink-50"
              onClick={goTryOnReady}
            >
              Thử đồ có sẵn
            </button>
            <button
              type="button"
              className="lg:hidden px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white shrink-0"
              onClick={() => setMobileOpen(true)}
            >
              Upload & Lọc
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StepIndicator currentStep={state.step} />

        {state.ui.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {state.ui.error}
          </div>
        )}

        <FabricWarning
          validation={state.fabricValidation}
          onContinue={continueAfterFabricWarning}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block lg:w-80 xl:w-96 shrink-0 space-y-6">
            <SidebarContent
              state={state}
              dispatch={dispatch}
              startGenerate={startGenerate}
              canGenerate={canGenerate}
              generateTooltip={generateTooltip}
              isLoading={isLoading}
              {...personProps}
            />
          </aside>

          <section className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            {!state.inputs.personImage && (
              <div className="mb-6 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40">
                <h2 className="font-semibold text-slate-800 mb-1">Bước 1: Upload ảnh người</h2>
                <p className="text-xs text-slate-600 mb-3">
                  Chọn ảnh toàn thân hoặc nửa người để AI gợi ý quần áo phù hợp.
                </p>
                <ImageUploader
                  inputs={state.inputs}
                  dispatch={dispatch}
                  variant="hero"
                  {...personProps}
                />
              </div>
            )}

            <h2 className="font-semibold text-slate-800 mb-4">Preview quần áo</h2>
            <GarmentPreview
              garments={state.garments}
              selectedGarmentId={state.selectedGarmentId}
              hasFabric={Boolean(state.inputs.fabricImage)}
              onSelect={(id) => dispatch({ type: 'SELECT_GARMENT', id })}
              onRemix={(id) => dispatch({ type: 'SET_REMIX_MODAL', show: true, id })}
              onRemove={(id) => dispatch({ type: 'REMOVE_GARMENT', id })}
              onFeedback={(id, feedback) => dispatch({ type: 'SET_FEEDBACK', id, feedback })}
              onZoom={(url) => setZoomGarment(url)}
              onTryOn={goTryOnReady}
              onTryOnReady={goTryOnReady}
              canTryOn={Boolean(state.selectedGarmentId && state.inputs.personImage)}
              isLoading={isLoading}
              progress={
                isLoading
                  ? { current: state.generate.current, total: state.generate.count }
                  : null
              }
              onSave={(id) => {
                const g = state.garments.find((x) => x.id === id);
                saveGarment(g);
              }}
              isGarmentSaved={wardrobe.isGarmentSaved}
            />

            {showTryOnSetup && !state.tryOn.result && (
              <TryOnSetup
                personImage={state.inputs.personImage}
                garment={selectedGarment}
                onPersonFile={(dataUrl) => dispatch({ type: 'SET_INPUT', field: 'personImage', value: dataUrl })}
                onClearPerson={() => dispatch({ type: 'SET_INPUT', field: 'personImage', value: null })}
                onPickPerson={() => setPicker({ open: true, mode: 'person' })}
                onSavePerson={savePerson}
                personSaved={wardrobe.isPersonSaved(state.inputs.personImage)}
                onGarmentFile={(dataUrl, base64) =>
                  dispatch({ type: 'ADD_GARMENT', garment: garmentFromUpload(dataUrl, base64) })
                }
                onClearGarment={() => {
                  if (selectedGarment && selectedGarment.source !== 'generated') {
                    dispatch({ type: 'REMOVE_GARMENT', id: selectedGarment.id });
                  } else {
                    dispatch({ type: 'SELECT_GARMENT', id: null });
                  }
                }}
                onPickGarment={() => setPicker({ open: true, mode: 'garment' })}
                onSaveGarment={() => saveGarment(selectedGarment)}
                garmentSaved={wardrobe.isGarmentSaved(selectedGarment?.imageBase64)}
                onStart={handleTryOn}
                canStart={Boolean(state.inputs.personImage && selectedGarment)}
                loading={tryOnLoading}
              />
            )}

            <TryOnResult
              result={state.tryOn.result}
              personImage={state.inputs.personImage}
              error={state.tryOn.status === 'error' ? state.tryOn.error : null}
              onRetry={handleTryOn}
              onTryAnother={() => dispatch({ type: 'SET_STEP', value: 'preview' })}
            />
          </section>
        </div>
      </main>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(100%,20rem)] bg-fashion-surface p-4 overflow-y-auto shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Upload & Bộ lọc</h2>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-slate-500">
                Đóng
              </button>
            </div>
            <SidebarContent
              state={state}
              dispatch={dispatch}
              startGenerate={onGenerateClick}
              canGenerate={canGenerate}
              generateTooltip={generateTooltip}
              isLoading={isLoading}
              {...personProps}
            />
          </div>
        </div>
      )}

      {canGenerate && (
        <button
          type="button"
          disabled={isLoading}
          onClick={onGenerateClick}
          className="lg:hidden fixed bottom-4 right-4 z-30 px-5 py-3 bg-indigo-600 text-white font-medium rounded-full shadow-lg disabled:opacity-50"
        >
          Tạo outfit
        </button>
      )}

      <RemixModal
        show={state.ui.showRemixModal}
        filters={state.filters}
        onClose={() => dispatch({ type: 'SET_REMIX_MODAL', show: false })}
        onRemix={(fields) => {
          dispatch({ type: 'SET_REMIX_MODAL', show: false });
          remixGarment(state.ui.remixTargetId, fields);
        }}
        onAuto={() => {
          dispatch({ type: 'SET_REMIX_MODAL', show: false });
          autoRemix(state.ui.remixTargetId);
        }}
      />

      {zoomGarment && state.inputs.fabricImage && (
        <TextureZoom
          fabricImage={state.inputs.fabricImage}
          garmentImage={zoomGarment}
          onClose={() => setZoomGarment(null)}
        />
      )}

      <WardrobePicker
        open={picker.open}
        onClose={() => setPicker((p) => ({ ...p, open: false }))}
        mode={picker.mode}
        onPickPerson={(p) => {
          dispatch({ type: 'SET_INPUT', field: 'personImage', value: p.dataUrl });
          setPicker((prev) => ({ ...prev, open: false }));
          dispatch({ type: 'SET_TOAST', message: 'Đã chọn ảnh người từ tủ đồ' });
        }}
        onPickGarment={(g) => {
          dispatch({ type: 'ADD_GARMENT', garment: garmentFromWardrobe(g) });
          dispatch({ type: 'SET_STEP', value: 'tryon' });
          setPicker((prev) => ({ ...prev, open: false }));
          dispatch({ type: 'SET_TOAST', message: 'Đã chọn quần áo từ tủ đồ' });
        }}
      />

      <LoadingOverlay
        show={isLoading || tryOnLoading}
        message={
          tryOnLoading
            ? 'Đang thử đồ ảo...'
            : state.generate.status === 'validating'
              ? 'Đang phân tích vải...'
              : `Đang generate ${state.generate.current}/${state.generate.count}...`
        }
      />

      <Toast message={state.ui.toast} onClose={() => dispatch({ type: 'CLEAR_TOAST' })} />
    </div>
  );
}
