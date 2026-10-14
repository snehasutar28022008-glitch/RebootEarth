import { useEffect, useState } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useBasket, type BasketItem } from '@/context/BasketContext';
import { supabase } from '@/lib/supabase';
import type { Rate, GradeFactor, AcceptedItem, Setting, Order } from '@/lib/supabase';
import {
  CATEGORY_MAPPINGS,
  DATA_WIPE_CATEGORIES,
  determineGrade,
  getRecommendation,
  getHandlingTip,
  estimateValue,
  getAcceptedLabels,
  getCategoryMapping,
  isItemAccepted,
  type CategoryMapping,
} from '@/lib/itemUtils';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  Package, Camera, List, Plus, Trash2, AlertTriangle, CheckCircle,
  Smartphone, Laptop, Cable, Battery, Headphones, Wifi, HardDrive, Watch,
  Speaker, Calculator, CircuitBoard, Gamepad2, Mouse, RadioTower, Zap, ShoppingCart,
  ChevronRight, Info, Shield, RefreshCw, Heart, Upload, X, Edit3,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Mobile phones, smartphones and old keypad phones': Smartphone,
  'Chargers and adapters': Zap,
  'Cables and wires (USB, HDMI, power)': Cable,
  'Earphones and headphones': Headphones,
  'Power banks': Battery,
  'Small lithium-ion batteries (mobile, laptop, camera)': Battery,
  'Laptops and tablets': Laptop,
  'Keyboards and mice': Mouse,
  'Routers and modems': Wifi,
  'Pen drives, hard drives and memory cards': HardDrive,
  'Smartwatches and fitness bands': Watch,
  'Small speakers and Bluetooth devices': Speaker,
  'Remotes': RadioTower,
  'Calculators': Calculator,
  'Small circuit boards': CircuitBoard,
  'Small electronic toys': Gamepad2,
};

type Mode = 'select' | 'mode1' | 'mode2';

export function AddItemsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { items, removeItem, totalItems, totalValueMin, totalValueMax, hasHazardous, clearBasket } = useBasket();

  const [mode, setMode] = useState<Mode>('select');
  const [rates, setRates] = useState<Rate[]>([]);
  const [gradeFactors, setGradeFactors] = useState<GradeFactor[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<AcceptedItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ratesData }, { data: gradesData }, { data: itemsData }, { data: settingsData }] = await Promise.all([
        supabase.from('rates').select('*').order('category, grade'),
        supabase.from('grade_factors').select('*').order('grade'),
        supabase.from('accepted_items').select('*').order('type, sort_order'),
        supabase.from('settings').select('key, value'),
      ]);
      setRates((ratesData ?? []) as Rate[]);
      setGradeFactors((gradesData ?? []) as GradeFactor[]);
      setAcceptedItems((itemsData ?? []) as AcceptedItem[]);
      if (settingsData) {
        const map = (settingsData as Setting[]).reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {} as Record<string, string>);
        setSettings(map);
      }
      setLoading(false);
    })();
  }, []);

  const minQty = parseInt(settings['min_quantity'] || '3', 10);

  const [showCheckout, setShowCheckout] = useState(false);

  const handleProceedToBook = () => {
    const acceptedCount = items.filter((i) => i.source !== 'manual' || true).reduce((sum, i) => sum + i.quantity, 0);
    if (acceptedCount < minQty) {
      showToast(`Minimum ${minQty} accepted items per pickup. You have ${acceptedCount}.`, 'warning');
      return;
    }
    setShowCheckout(true);
  };

  if (loading) {
    return (
      <div className="container-max section-padding">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container-max section-padding animate-fade-in pb-24 lg:pb-12">
      <PageHeader
        title="Add E-Waste Items"
        subtitle="Add items one by one or upload a group photo. Build your pickup basket."
        icon={Package}
      />

      {/* Mode selection */}
      {mode === 'select' && (
        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <button
            onClick={() => setMode('mode1')}
            className="card card-hover group text-left animate-fade-in-up"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-600 shadow-lg">
              <Camera className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-display text-lg font-semibold text-forest-800 mb-2">One by One</h3>
            <p className="text-sm text-forest-600 mb-3">
              Add items individually with photo, category, and condition questions. Get a detailed result card for each item.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest-500 group-hover:gap-2 transition-all">
              Start adding <ChevronRight className="h-4 w-4" />
            </span>
          </button>

          <button
            onClick={() => setMode('mode2')}
            className="card card-hover group text-left animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-light to-forest-500 shadow-lg">
              <List className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-display text-lg font-semibold text-forest-800 mb-2">Group Photo</h3>
            <p className="text-sm text-forest-600 mb-3">
              Upload one photo of all your items. See an editable list of detected categories and quantities.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-forest-500 group-hover:gap-2 transition-all">
              Upload group photo <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}

      {/* Mode 1: One by One */}
      {mode === 'mode1' && (
        <ModeOneByOne
          rates={rates}
          gradeFactors={gradeFactors}
          acceptedItems={acceptedItems}
          onBack={() => setMode('select')}
        />
      )}

      {/* Mode 2: Group Photo */}
      {mode === 'mode2' && (
        <ModeGroupPhoto
          rates={rates}
          gradeFactors={gradeFactors}
          acceptedItems={acceptedItems}
          onBack={() => setMode('select')}
        />
      )}

      {/* Checkout form */}
      {showCheckout && (
        <CheckoutForm
          items={items}
          totalItems={totalItems}
          totalValueMin={totalValueMin}
          totalValueMax={totalValueMax}
          hasHazardous={hasHazardous}
          onCancel={() => setShowCheckout(false)}
          onSuccess={() => {
            clearBasket();
            setShowCheckout(false);
            navigate('/dashboard');
          }}
        />
      )}

      {/* Pickup Basket */}
      {items.length > 0 && !showCheckout && (
        <div className="mt-8">
          <PickupBasket
            items={items}
            removeItem={removeItem}
            totalItems={totalItems}
            totalValueMin={totalValueMin}
            totalValueMax={totalValueMax}
            hasHazardous={hasHazardous}
            minQty={minQty}
            onProceed={handleProceedToBook}
            onClear={clearBasket}
          />
        </div>
      )}

      {/* Basket empty state */}
      {items.length === 0 && mode !== 'select' && (
        <div className="mt-8">
          <EmptyState
            icon={ShoppingCart}
            title="Your basket is empty"
            message="Add items using the forms above to build your pickup basket."
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// MODE 1: One by One
// ============================================================
function ModeOneByOne({
  rates,
  gradeFactors,
  acceptedItems,
  onBack,
}: {
  rates: Rate[];
  gradeFactors: GradeFactor[];
  acceptedItems: AcceptedItem[];
  onBack: () => void;
}) {
  const { addItem } = useBasket();
  const { showToast } = useToast();

  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [works, setWorks] = useState<boolean | null>(null);
  const [damaged, setDamaged] = useState<boolean | null>(null);
  const [batterySwollen, setBatterySwollen] = useState<boolean | null>(null);
  const [result, setResult] = useState<BasketItem | null>(null);
  const [showResult, setShowResult] = useState(false);

  const mapping = selectedLabel ? getCategoryMapping(selectedLabel) : undefined;
  const acceptedLabels = getAcceptedLabels(acceptedItems);

  const handleAddToBasket = () => {
    if (!result) return;
    addItem(result);
    showToast(`${result.label} added to basket!`, 'success');
    // Reset form
    setSelectedLabel('');
    setPhotoUrl(undefined);
    setWorks(null);
    setDamaged(null);
    setBatterySwollen(null);
    setResult(null);
    setShowResult(false);
  };

  const handleAnalyze = () => {
    if (!mapping) return;

    const grade = determineGrade(works, damaged, mapping.hasBattery ? batterySwollen : false);
    const recommendation = getRecommendation(grade);
    const handlingTip = getHandlingTip(grade, mapping.hasBattery);
    const value = estimateValue(mapping.category, grade, rates, gradeFactors, mapping);

    const item: BasketItem = {
      id: crypto.randomUUID(),
      category: mapping.category,
      label: mapping.label,
      quantity: 1,
      grade,
      hazardLevel: grade === 'Hazardous' ? 'hazardous' : 'none',
      recommendation,
      handlingTip,
      hasBattery: mapping.hasBattery,
      photoUrl,
      estimatedValueMin: value.min,
      estimatedValueMax: value.max,
      unit: value.unit,
      isHighValue: mapping.isHighValue,
      source: 'mode1',
    };

    setResult(item);
    setShowResult(true);
  };

  const canAnalyze = mapping && works !== null && damaged !== null && (!mapping.hasBattery || batterySwollen !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-medium text-forest-500 hover:text-forest-600 flex items-center gap-1">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to modes
        </button>
        <h2 className="font-display text-xl font-bold text-forest-800">Add Item One by One</h2>
      </div>

      <div className="card space-y-5">
        {/* Photo upload (optional) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-forest-700">Photo <span className="text-forest-400">(optional)</span></label>
          <PhotoUpload onUpload={setPhotoUrl} photoUrl={photoUrl} />
        </div>

        {/* Category picker */}
        <div>
          <label className="mb-2 block text-sm font-medium text-forest-700">Category *</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {acceptedLabels.map((label) => {
              const Icon = CATEGORY_ICONS[label] || Package;
              const isSelected = selectedLabel === label;
              const itemType = isItemAccepted(label, acceptedItems);
              return (
                <button
                  key={label}
                  onClick={() => {
                    setSelectedLabel(label);
                    setShowResult(false);
                    setResult(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-forest-500 bg-forest-50 text-forest-700'
                      : 'border-gray-200 text-forest-600 hover:border-forest-200 hover:bg-forest-50/30'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-forest-500" />
                  <div className="min-w-0">
                    <span className="line-clamp-2 block">{label}</span>
                    <ItemTypeBadge type={itemType} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Condition questions */}
        {mapping && (
          <div className="space-y-4 animate-fade-in rounded-2xl bg-forest-50/50 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-forest-700">Does it work? *</p>
              <div className="flex gap-2">
                <ToggleButton value={works} onValue={() => { setWorks(true); setShowResult(false); }} offValue={() => { setWorks(false); setShowResult(false); }} positiveLabel="Yes, it works" negativeLabel="No" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-forest-700">Is there physical damage? *</p>
              <div className="flex gap-2">
                <ToggleButton value={damaged} onValue={() => { setDamaged(true); setShowResult(false); }} offValue={() => { setDamaged(false); setShowResult(false); }} positiveLabel="Yes, damaged" negativeLabel="No damage" isPositiveBad />
              </div>
            </div>
            {mapping.hasBattery && (
              <div className="animate-fade-in">
                <p className="mb-2 text-sm font-medium text-hazard">Is the battery swollen or leaking? *</p>
                <div className="flex gap-2">
                  <ToggleButton value={batterySwollen} onValue={() => { setBatterySwollen(true); setShowResult(false); }} offValue={() => { setBatterySwollen(false); setShowResult(false); }} positiveLabel="Yes, swollen/leaking" negativeLabel="No" isPositiveBad isHazard />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {canAnalyze && !showResult && (
          <button onClick={handleAnalyze} className="btn-primary w-full">
            <Info className="h-4 w-4" />
            Analyze Item
          </button>
        )}

        {/* Result card */}
        {showResult && result && (
          <ResultCard item={result} onAdd={handleAddToBasket} onReset={() => { setShowResult(false); setResult(null); }} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// MODE 2: Group Photo
// ============================================================
function ModeGroupPhoto({
  rates,
  gradeFactors,
  acceptedItems,
  onBack,
}: {
  rates: Rate[];
  gradeFactors: GradeFactor[];
  acceptedItems: AcceptedItem[];
  onBack: () => void;
}) {
  const { addItem } = useBasket();
  const { showToast } = useToast();

  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [detectedItems, setDetectedItems] = useState<{ label: string; quantity: number; mapping: CategoryMapping }[]>([]);
  const [batterySwollen, setBatterySwollen] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const acceptedLabels = getAcceptedLabels(acceptedItems);

  // Simulate "AI detection" — since AI photo analysis is Step 8, we let user manually add items here
  const handleSimulateDetection = () => {
    if (!photoUrl) {
      showToast('Please upload a photo first', 'warning');
      return;
    }
    setAnalyzing(true);
    // Simulate AI delay
    setTimeout(() => {
      setAnalyzing(false);
      setShowManual(true);
      showToast('AI photo analysis will be available soon. Please select your items manually.', 'info');
    }, 1500);
  };

  const handleAddManualItem = (label: string, quantity: number) => {
    const mapping = getCategoryMapping(label);
    if (!mapping) return;

    const grade = determineGrade(true, false, mapping.hasBattery ? batterySwollen === true : false);
    const recommendation = getRecommendation(grade);
    const handlingTip = getHandlingTip(grade, mapping.hasBattery);
    const value = estimateValue(mapping.category, grade, rates, gradeFactors, mapping);

    const item: BasketItem = {
      id: crypto.randomUUID(),
      category: mapping.category,
      label: mapping.label,
      quantity,
      grade,
      hazardLevel: grade === 'Hazardous' ? 'hazardous' : 'none',
      recommendation,
      handlingTip,
      hasBattery: mapping.hasBattery,
      photoUrl,
      estimatedValueMin: value.min,
      estimatedValueMax: value.max,
      unit: value.unit,
      isHighValue: mapping.isHighValue,
      source: 'mode2',
    };

    addItem(item);
    showToast(`${quantity}x ${mapping.label} added to basket!`, 'success');
    setDetectedItems((prev) => [...prev, { label: mapping.label, quantity, mapping }]);
    setShowResult(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-medium text-forest-500 hover:text-forest-600 flex items-center gap-1">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to modes
        </button>
        <h2 className="font-display text-xl font-bold text-forest-800">Group Photo</h2>
      </div>

      <div className="card space-y-5">
        {/* Photo upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-forest-700">Upload a photo of all your items *</label>
          <PhotoUpload onUpload={setPhotoUrl} photoUrl={photoUrl} />
        </div>

        {/* Analyze button */}
        {photoUrl && !showManual && (
          <button onClick={handleSimulateDetection} disabled={analyzing} className="btn-primary w-full">
            {analyzing ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Analyzing photo...</>
            ) : (
              <><Camera className="h-4 w-4" /> Analyze Photo</>
            )}
          </button>
        )}

        {/* Safety question */}
        {showManual && (
          <div className="space-y-4 animate-fade-in rounded-2xl bg-forest-50/50 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-hazard">Is any battery swollen or leaking? *</p>
              <div className="flex gap-2">
                <ToggleButton
                  value={batterySwollen}
                  onValue={() => setBatterySwollen(true)}
                  offValue={() => setBatterySwollen(false)}
                  positiveLabel="Yes, swollen/leaking"
                  negativeLabel="No"
                  isPositiveBad
                  isHazard
                />
              </div>
            </div>

            {/* Hazard warning */}
            {batterySwollen && (
              <HazardWarning />
            )}

            {/* Manual item picker */}
            <div>
              <p className="mb-2 text-sm font-medium text-forest-700">Select your items:</p>
              <GroupItemPicker acceptedLabels={acceptedLabels} acceptedItems={acceptedItems} onAdd={handleAddManualItem} />
            </div>
          </div>
        )}

        {/* Note */}
        {photoUrl && !showManual && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-light/20 p-4">
            <Info className="h-5 w-5 text-amber-dark flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-dark">
              AI photo analysis will be available in a future update. For now, you can manually select items after uploading your photo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// GROUP ITEM PICKER
// ============================================================
function GroupItemPicker({
  acceptedLabels,
  acceptedItems,
  onAdd,
}: {
  acceptedLabels: string[];
  acceptedItems: AcceptedItem[];
  onAdd: (label: string, quantity: number) => void;
}) {
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const selectedItemType = selectedLabel ? isItemAccepted(selectedLabel, acceptedItems) : 'unknown';

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="input-field"
          >
            <option value="">Select a category...</option>
            {acceptedLabels.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100"
          >
            -
          </button>
          <span className="w-12 text-center font-bold text-forest-800">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100"
          >
            +
          </button>
        </div>
        <button
          onClick={() => {
            if (selectedLabel) {
              onAdd(selectedLabel, quantity);
              setSelectedLabel('');
              setQuantity(1);
            }
          }}
          disabled={!selectedLabel}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {selectedLabel && <ItemTypeBadge type={selectedItemType} />}
    </div>
  );
}

// ============================================================
// RESULT CARD
// ============================================================
function ResultCard({
  item,
  onAdd,
  onReset,
}: {
  item: BasketItem;
  onAdd: () => void;
  onReset: () => void;
}) {
  const Icon = CATEGORY_ICONS[item.label] || Package;
  const showDataWipe = DATA_WIPE_CATEGORIES.includes(item.category);

  const gradeBadge = {
    A: 'badge-success',
    B: 'badge-info',
    C: 'badge-warning',
    Hazardous: 'badge-hazard',
  }[item.grade];

  const RecIcon = {
    recycle: RefreshCw,
    repair: Edit3,
    donate: Heart,
  }[item.recommendation];

  const recColor = {
    recycle: 'text-forest-500 bg-forest-50',
    repair: 'text-amber-dark bg-amber-light/20',
    donate: 'text-emerald-light bg-mint/40',
  }[item.recommendation];

  return (
    <div className="animate-bounce-in rounded-2xl border-2 border-forest-100 bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-forest-50">
          <Icon className="h-6 w-6 text-forest-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-sm font-bold text-forest-800">{item.label}</h3>
            <span className={gradeBadge}>{item.grade}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${recColor}`}>
              {RecIcon && <RecIcon className="h-3 w-3" />}
              {item.recommendation === 'recycle' && 'Recycle'}
              {item.recommendation === 'repair' && 'Repair possible'}
              {item.recommendation === 'donate' && 'Can be donated'}
            </span>
            <span className="badge-success">
              <CheckCircle className="h-3 w-3" /> Accepted
            </span>
          </div>
        </div>
      </div>

      {/* Estimated value */}
      <div className="rounded-xl bg-forest-50/50 p-3">
        <p className="text-xs font-medium text-forest-600 mb-1">Estimated value range</p>
        {item.grade === 'Hazardous' ? (
          <p className="font-display text-lg font-bold text-hazard">No payment (hazardous)</p>
        ) : (
          <p className="font-display text-lg font-bold text-forest-800">
            ₹{item.estimatedValueMin} – ₹{item.estimatedValueMax}
            <span className="text-xs font-normal text-forest-500 ml-2">
              {item.unit === 'per_kg' ? 'per item (est. weight)' : 'per item'}
            </span>
          </p>
        )}
        <p className="text-xs text-forest-400 mt-1">
          {item.isHighValue ? 'High-value item — pays into wallet' : 'Low-value item — earns reward points'}
        </p>
      </div>

      {/* Hazard warning */}
      {item.hazardLevel === 'hazardous' && <HazardWarning />}

      {/* Data wipe checklist */}
      {showDataWipe && <DataWipeChecklist />}

      {/* Handling tip */}
      <div className="flex items-start gap-3 rounded-xl bg-mint/20 p-3">
        <Shield className="h-5 w-5 text-forest-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-forest-700 mb-1">Handling tip</p>
          <p className="text-xs text-forest-600">{item.handlingTip}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onAdd} className="btn-primary flex-1">
          <Plus className="h-4 w-4" /> Add to Basket
        </button>
        <button onClick={onReset} className="btn-outline">
          <RefreshCw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
}

// ============================================================
// HAZARD WARNING
// ============================================================
function HazardWarning() {
  return (
    <div className="animate-fade-in rounded-xl border-2 border-hazard/30 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-hazard flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-display text-sm font-bold text-hazard mb-1">Hazardous Battery Detected</h4>
          <p className="text-xs text-hazard/80 mb-2">
            This item requires special handling. Please follow these safety instructions:
          </p>
          <ul className="space-y-1 text-xs text-hazard/80">
            <li>• Keep the battery away from heat sources and open flames</li>
            <li>• Do not charge or attempt to use the device</li>
            <li>• Do not puncture, crush, or disassemble the battery</li>
            <li>• Store in a non-flammable container until pickup</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DATA WIPE CHECKLIST
// ============================================================
function DataWipeChecklist() {
  const [checked, setChecked] = useState({
    backup: false,
    reset: false,
    sim: false,
  });

  const allChecked = checked.backup && checked.reset && checked.sim;

  return (
    <div className="rounded-xl border-2 border-forest-200 bg-forest-50/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="h-5 w-5 text-forest-500" />
        <h4 className="font-display text-sm font-bold text-forest-800">Data Wipe Checklist</h4>
      </div>
      <p className="text-xs text-forest-600 mb-3">Before handing over, please complete these steps:</p>
      <div className="space-y-2">
        {[
          { key: 'backup', label: 'Back up your data to cloud or computer' },
          { key: 'reset', label: 'Perform a factory reset to erase all data' },
          { key: 'sim', label: 'Remove SIM card and SD card' },
        ].map((step) => (
          <label key={step.key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked[step.key as keyof typeof checked]}
              onChange={(e) => setChecked((prev) => ({ ...prev, [step.key]: e.target.checked }))}
              className="h-5 w-5 rounded border-2 border-forest-300 text-forest-500 focus:ring-forest-500/20"
            />
            <span className="text-xs text-forest-700">{step.label}</span>
          </label>
        ))}
      </div>
      <div className={`mt-3 rounded-lg p-2 text-xs ${allChecked ? 'bg-forest-50 text-forest-700' : 'bg-amber-light/20 text-amber-dark'}`}>
        {allChecked ? (
          <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> All steps completed. Your data is safe.</span>
        ) : (
          <span className="flex items-center gap-1"><Info className="h-4 w-4" /> Please complete all steps to protect your personal data.</span>
        )}
      </div>
      <p className="mt-2 text-xs text-forest-400">
        Disclaimer: While our recycling partner ensures data destruction, Reboot Earth is not liable for data remaining on devices.
      </p>
    </div>
  );
}

// ============================================================
// PHOTO UPLOAD
// ============================================================
function PhotoUpload({
  onUpload,
  photoUrl,
}: {
  onUpload: (url: string | undefined) => void;
  photoUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const fileName = `${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;
    const { error: uploadError } = await supabase.storage.from('item-photos').upload(fileName, file, { contentType: file.type });
    setUploading(false);
    if (uploadError) {
      showToast(`Upload failed: ${uploadError.message}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('item-photos').getPublicUrl(fileName);
    onUpload(data.publicUrl);
    showToast('Photo uploaded', 'success');
  };

  return (
    <div>
      {photoUrl ? (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={photoUrl} alt="Uploaded item" className="w-full h-48 object-cover" />
          <button
            onClick={() => onUpload(undefined)}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-forest-700 hover:bg-white shadow-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-forest-200 bg-forest-50/30 px-4 py-8 cursor-pointer transition-all hover:border-forest-400 hover:bg-forest-50/50">
          {uploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-500" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-forest-400" />
              <span className="text-sm font-medium text-forest-600">Click to upload a photo</span>
              <span className="text-xs text-forest-400">JPG, PNG up to 5MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

// ============================================================
// TOGGLE BUTTON
// ============================================================
function ToggleButton({
  value,
  onValue,
  offValue,
  positiveLabel,
  negativeLabel,
  isPositiveBad = false,
  isHazard = false,
}: {
  value: boolean | null;
  onValue: () => void;
  offValue: () => void;
  positiveLabel: string;
  negativeLabel: string;
  isPositiveBad?: boolean;
  isHazard?: boolean;
}) {
  const positiveActive = value === true;
  const negativeActive = value === false;

  const positiveClass = isHazard
    ? positiveActive ? 'bg-hazard text-white border-hazard' : 'border-hazard/30 text-hazard hover:bg-red-50'
    : isPositiveBad
      ? positiveActive ? 'bg-amber-dark text-white border-amber-dark' : 'border-amber-dark/30 text-amber-dark hover:bg-amber-light/10'
      : positiveActive ? 'bg-forest-500 text-white border-forest-500' : 'border-forest-200 text-forest-600 hover:bg-forest-50/50';

  const negativeClass = negativeActive ? 'bg-forest-500 text-white border-forest-500' : 'border-forest-200 text-forest-600 hover:bg-forest-50/50';

  return (
    <>
      <button onClick={onValue} className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${positiveClass}`}>
        {positiveLabel}
      </button>
      <button onClick={offValue} className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${negativeClass}`}>
        {negativeLabel}
      </button>
    </>
  );
}

// ============================================================
// PICKUP BASKET
// ============================================================
function PickupBasket({
  items,
  removeItem,
  totalItems,
  totalValueMin,
  totalValueMax,
  hasHazardous,
  minQty,
  onProceed,
  onClear,
}: {
  items: BasketItem[];
  removeItem: (id: string) => void;
  totalItems: number;
  totalValueMin: number;
  totalValueMax: number;
  hasHazardous: boolean;
  minQty: number;
  onProceed: () => void;
  onClear: () => void;
}) {
  const { navigate } = useRouter();

  return (
    <div className="card p-0 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-forest-100 bg-forest-50/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-forest-800">Pickup Basket</h2>
            <p className="text-xs text-forest-600">{totalItems} item{totalItems !== 1 ? 's' : ''} • Minimum {minQty} per pickup</p>
          </div>
        </div>
        <button onClick={onClear} className="text-xs font-medium text-hazard hover:text-hazard/80 flex items-center gap-1">
          <Trash2 className="h-3 w-3" /> Clear all
        </button>
      </div>

      {/* Items list */}
      <div className="divide-y divide-forest-50">
        {items.map((item) => {
          const Icon = CATEGORY_ICONS[item.label] || Package;
          return (
            <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-forest-50/20 transition-colors">
              {item.photoUrl ? (
                <img src={item.photoUrl} alt={item.label} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-forest-50 flex-shrink-0">
                  <Icon className="h-6 w-6 text-forest-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-forest-800 truncate">{item.label}</h3>
                  <span className="badge-info text-[10px]">x{item.quantity}</span>
                  {item.grade === 'Hazardous' && (
                    <span className="badge-hazard text-[10px]"><AlertTriangle className="h-2 w-2" /> Hazard</span>
                  )}
                </div>
                <p className="text-xs text-forest-500 mt-0.5">
                  Grade {item.grade} • {item.recommendation}
                  {item.estimatedValueMin > 0 && ` • ₹${item.estimatedValueMin}–₹${item.estimatedValueMax}`}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-hazard transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Hazard warning */}
      {hasHazardous && (
        <div className="border-t border-hazard/20 bg-red-50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-hazard">
            <AlertTriangle className="h-4 w-4" />
            Your basket contains hazardous items. They will be flagged for special handling.
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-forest-100 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-forest-600">Total estimated value</p>
            <p className="font-display text-xl font-bold text-forest-800">
              ₹{totalValueMin} – ₹{totalValueMax}
            </p>
            <p className="text-xs text-forest-400">Final value set by admin at collection</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-forest-600">Total items</p>
            <p className="font-display text-xl font-bold text-forest-800">{totalItems}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/accept')} className="btn-outline flex-1">
            <List className="h-4 w-4" /> What We Accept
          </button>
          <button
            onClick={onProceed}
            disabled={totalItems < minQty}
            className="btn-primary flex-1"
          >
            Proceed to Checkout
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {totalItems < minQty && (
          <p className="mt-2 text-center text-xs text-amber-dark">
            Add {minQty - totalItems} more item{minQty - totalItems !== 1 ? 's' : ''} to reach the minimum of {minQty}.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ITEM TYPE BADGE
// ============================================================
function ItemTypeBadge({ type }: { type: 'accepted' | 'special' | 'not_accepted' | 'special_request' | 'unknown' }) {
  const config = {
    accepted: { label: 'Accepted', class: 'bg-forest-50 text-forest-600' },
    special: { label: 'Special Handling', class: 'bg-amber-light/20 text-amber-dark' },
    special_request: { label: 'Request Approval', class: 'bg-amber-light/20 text-amber-dark' },
    not_accepted: { label: 'Not Accepted', class: 'bg-red-50 text-hazard' },
    unknown: { label: 'Unknown', class: 'bg-gray-100 text-gray-500' },
  };
  const c = config[type] || config.unknown;
  return (
    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${c.class}`}>
      {c.label}
    </span>
  );
}

// ============================================================
// CHECKOUT FORM
// ============================================================
function CheckoutForm({
  items,
  totalItems,
  totalValueMin,
  totalValueMax,
  hasHazardous,
  onCancel,
  onSuccess,
}: {
  items: BasketItem[];
  totalItems: number;
  totalValueMin: number;
  totalValueMax: number;
  hasHazardous: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00'];

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be signed in to place an order.');
      return;
    }
    if (!address.trim() || !phone.trim() || !pickupDate || !pickupSlot) {
      setError('Please fill in all fields: address, phone, date, and time slot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const hasSpecialRequest = items.some((i) => i.isHighValue === false && i.category.includes('Large') || false);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'submitted',
          pickup_address: address,
          pickup_phone: phone,
          pickup_date: pickupDate,
          pickup_slot: pickupSlot,
          total_items: totalItems,
          estimated_value_min: totalValueMin,
          estimated_value_max: totalValueMax,
          has_special_request: hasSpecialRequest,
          has_hazardous: hasHazardous,
        })
        .select()
        .single();

      if (orderError) {
        setError(`Failed to create order: ${orderError.message}`);
        setSubmitting(false);
        return;
      }

      const order = orderData as Order;

      const itemRows = items.map((item) => ({
        order_id: order.id,
        user_id: user.id,
        category: item.category,
        name: item.label,
        image_url: item.photoUrl || null,
        item_type: 'accepted' as const,
        quantity: item.quantity,
        grade: item.grade,
        estimated_value_min: item.estimatedValueMin,
        estimated_value_max: item.estimatedValueMax,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemRows);

      if (itemsError) {
        setError(`Order created but items failed: ${itemsError.message}`);
        setSubmitting(false);
        return;
      }

      showToast('Order placed successfully!', 'success');
      onSuccess();
    } catch (err) {
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-8 animate-fade-in-up">
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-500">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-forest-800">Checkout</h2>
              <p className="text-xs text-forest-600">{totalItems} items &middot; Est. ₹{totalValueMin}–₹{totalValueMax}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-xs font-medium text-forest-500 hover:text-forest-600">
            Back to basket
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
            <AlertTriangle className="h-5 w-5 text-hazard flex-shrink-0" />
            <p className="text-sm text-hazard">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-forest-700">Pickup Address *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address for pickup"
              rows={2}
              className="w-full rounded-xl border-2 border-forest-200 bg-white px-4 py-2.5 text-sm text-forest-800 placeholder-forest-400 focus:border-forest-400 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border-2 border-forest-200 bg-white px-4 py-2.5 text-sm text-forest-800 placeholder-forest-400 focus:border-forest-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-700">Pickup Date *</label>
              <input
                type="date"
                value={pickupDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full rounded-xl border-2 border-forest-200 bg-white px-4 py-2.5 text-sm text-forest-800 focus:border-forest-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-forest-700">Pickup Time Slot *</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setPickupSlot(slot)}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all ${
                    pickupSlot === slot
                      ? 'border-forest-500 bg-forest-50 text-forest-700'
                      : 'border-forest-200 text-forest-600 hover:bg-forest-50/30'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {hasHazardous && (
            <div className="flex items-center gap-2 rounded-xl border-2 border-hazard/20 bg-red-50 p-3">
              <AlertTriangle className="h-5 w-5 text-hazard flex-shrink-0" />
              <p className="text-xs text-hazard">Your basket contains hazardous items. They will be flagged for special handling.</p>
            </div>
          )}

          <div className="border-t border-forest-100 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-forest-600">Total estimated value</p>
                <p className="font-display text-xl font-bold text-forest-800">₹{totalValueMin} – ₹{totalValueMax}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-forest-600">Total items</p>
                <p className="font-display text-xl font-bold text-forest-800">{totalItems}</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !address || !phone || !pickupDate || !pickupSlot}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Placing order...</>
              ) : (
                <><CheckCircle className="h-4 w-4" /> Place Order</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
