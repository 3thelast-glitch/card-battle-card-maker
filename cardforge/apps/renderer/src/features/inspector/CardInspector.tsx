import { useMemo, useState } from 'react';
import type { ArtTransform, CardArt, CardArtVideoMeta, CardRace, CardTrait, DataRow, ElementKey, Project } from '../../../../../packages/core/src/index';
import { resolvePath } from '../../../../../packages/core/src/index';
import { useTranslation } from 'react-i18next';
import { Button, Input, Row, Select, Toggle, Badge, Divider } from '../../components/ui';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';
import { TemplatePicker } from '../templates/TemplatePicker';
import { TraitIcon, TRAIT_META, type TraitKey } from '../../ui/icons/traitIcons';
import { ELEMENTS, getMatchup } from '../../lib/elements';
import { Dialog } from '../../ui/Dialog';

type Props = {
  row?: DataRow;
  project: Project;
  columns: string[];
  language: 'en' | 'ar';
  showVideoControls: boolean;
  onToggleVideoControls: (next: boolean) => void;
  keepVideoAudio: boolean;
  onToggleKeepVideoAudio: (next: boolean) => void;
  onUpdateData: (path: string, value: any) => void;
  onUpdateStat: (key: 'attack' | 'defense', value: number) => void;
  onUpdateRow: (patch: Partial<DataRow>) => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRegeneratePoster: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const RACE_OPTIONS: CardRace[] = ['human', 'elf', 'demon', 'beast', 'animal', 'amphibian'];
const TRAIT_OPTIONS: TraitKey[] = ['fire', 'ice', 'swordsman', 'archer', 'mage', 'tank', 'poison', 'flying', 'holy', 'shadow'];

export function CardInspector(props: Props) {
  const { t } = useTranslation();
  const [traitQuery, setTraitQuery] = useState('');
  const [aiLoading, setAiLoading] = useState<'name' | 'desc' | 'balance' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [balanceSuggestion, setBalanceSuggestion] = useState<{ attack: number; defense: number; cost: number } | null>(null);
  const [confirmBalanceOpen, setConfirmBalanceOpen] = useState(false);
  const row = props.row;
  const data = row?.data ?? {};
  const art: CardArt | undefined = row?.art ?? (data as any).art;
  const artTransform = normalizeArtTransform(art?.transform);
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template);
  const race = normalizeRace(data.race);
  const element = normalizeElement(data.element);
  const traits = normalizeTraits(data.traits ?? (data as any).trait);
  const bgColor = String(data.bgColor ?? '');
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const cost = data.cost != null ? normalizeNumber(data.cost) : '';
  const nameEn = getLocalizedValue(data.name ?? data.title ?? data.character_name ?? data.character_name_en, 'en');
  const nameAr = getLocalizedValue(data.name ?? data.title ?? data.character_name ?? data.character_name_ar, 'ar');
  const abilityEn = getLocalizedValue(data.desc ?? data.ability ?? data.ability_en, 'en');
  const abilityAr = getLocalizedValue(data.desc ?? data.ability ?? data.ability_ar, 'ar');
  const tagsValue = Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags ?? '');
  const videoMeta = art?.kind === 'video' ? art.meta : undefined;
  const missingPoster = art?.kind === 'video' && !art.poster;
  const missingFields = !hasLocalizedValue(data.name) || !hasLocalizedValue(data.desc ?? data.ability);
  const total = attack + defense;

  const traitSet = new Set(traits);
  const normalizedTraitQuery = traitQuery.trim().toLowerCase();
  const traitSuggestions = useMemo(() => {
    const list = TRAIT_OPTIONS.filter((trait) => !traitSet.has(trait as CardTrait));
    if (!normalizedTraitQuery) return list.slice(0, 8);
    return list
      .filter((trait) => {
        const meta = TRAIT_META[trait];
        const label = t(meta?.labelKey ?? `traits.${trait}`, { defaultValue: trait }).toLowerCase();
        return trait.includes(normalizedTraitQuery) || label.includes(normalizedTraitQuery);
      })
      .slice(0, 8);
  }, [normalizedTraitQuery, traitSet, t]);
  const matchup = useMemo(() => getMatchup(element || undefined), [element]);

  const resolveAiError = (code?: string) => {
    if (code === 'MISSING_API_KEY') return t('ai.errorMissingKey');
    return t('ai.errorFailed');
  };

  const buildContext = () => {
    const raceText = race || 'none';
    const traitText = traits.length ? traits.join(', ') : 'none';
    const elementText = element || 'none';
    const abilityId = String((data as any).ability_id ?? (data as any).abilityId ?? '').trim();
    const abilityText = props.language === 'ar' ? abilityAr : abilityEn;
    return [
      `Rarity: ${rarity}`,
      `Element: ${elementText}`,
      `Race: ${raceText}`,
      `Traits: ${traitText}`,
      abilityId ? `AbilityId: ${abilityId}` : null,
      abilityText ? `Ability: ${abilityText}` : null,
      `Current stats: ATK ${attack} DEF ${defense} COST ${cost || 0}`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const parseBalanceSuggestion = (text: string) => {
    const cleaned = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      const attackValue = Number(parsed.attack ?? parsed.atk);
      const defenseValue = Number(parsed.defense ?? parsed.def);
      const costValue = Number(parsed.cost ?? parsed.mana ?? 0);
      if (Number.isFinite(attackValue) && Number.isFinite(defenseValue)) {
        return {
          attack: Math.max(0, Math.round(attackValue)),
          defense: Math.max(0, Math.round(defenseValue)),
          cost: Number.isFinite(costValue) ? Math.max(0, Math.round(costValue)) : 0,
        };
      }
    } catch {
      // fall through to loose parsing
    }
    const numbers = cleaned.match(/-?\d+(\.\d+)?/g) ?? [];
    if (numbers.length >= 2) {
      const attackValue = Number(numbers[0]);
      const defenseValue = Number(numbers[1]);
      const costValue = numbers.length >= 3 ? Number(numbers[2]) : Number(cost) || 0;
      if (Number.isFinite(attackValue) && Number.isFinite(defenseValue)) {
        return {
          attack: Math.max(0, Math.round(attackValue)),
          defense: Math.max(0, Math.round(defenseValue)),
          cost: Number.isFinite(costValue) ? Math.max(0, Math.round(costValue)) : 0,
        };
      }
    }
    return null;
  };

  const runAi = async (mode: 'name' | 'desc' | 'balance') => {
    if (!window.ai?.generate) {
      setAiError(t('ai.errorMissingKey'));
      return;
    }
    setAiLoading(mode);
    setAiError(null);
    try {
      const context = buildContext();
      let prompt = '';
      if (mode === 'name') {
        prompt = `Generate a short ${props.language === 'ar' ? 'Arabic' : 'English'} card name. Avoid profanity. Use 2-4 words. Context:\n${context}\nReturn only the name.`;
      } else if (mode === 'desc') {
        prompt = `Write a concise ${props.language === 'ar' ? 'Arabic' : 'English'} card ability description (1-2 lines). Avoid profanity. Context:\n${context}\nReturn only the description text.`;
      } else {
        prompt = `Suggest balanced stats for a trading card using the context below. Return JSON only with keys attack, defense, cost (integers).\n${context}`;
      }

      const result = await window.ai.generate({ prompt });
      if (!result?.ok) {
        setAiError(resolveAiError(result?.error));
        return;
      }
      const text = String(result.text ?? '').trim();
      if (!text) {
        setAiError(t('ai.errorFailed'));
        return;
      }

      if (mode === 'name') {
        const cleaned = text.replace(/^["']|["']$/g, '').trim();
        if (props.language === 'ar') props.onUpdateData('name.ar', cleaned);
        else props.onUpdateData('name.en', cleaned);
        return;
      }

      if (mode === 'desc') {
        const cleaned = text.replace(/^["']|["']$/g, '').trim();
        if (props.language === 'ar') props.onUpdateData('desc.ar', cleaned);
        else props.onUpdateData('desc.en', cleaned);
        return;
      }

      const suggestion = parseBalanceSuggestion(text);
      if (!suggestion) {
        setAiError(t('ai.errorFailed'));
        return;
      }
      setBalanceSuggestion(suggestion);
      setConfirmBalanceOpen(true);
    } catch (error: any) {
      setAiError(resolveAiError(error?.message));
    } finally {
      setAiLoading(null);
    }
  };

  const addTrait = (trait: string) => {
    const cleaned = String(trait || '').toLowerCase().trim();
    if (!cleaned) return;
    if (traitSet.has(cleaned as CardTrait)) {
      setTraitQuery('');
      return;
    }
    props.onUpdateData('traits', Array.from(new Set([...traits, cleaned])));
    setTraitQuery('');
  };

  const removeTrait = (trait: string) => {
    const cleaned = String(trait || '').toLowerCase().trim();
    props.onUpdateData(
      'traits',
      traits.filter((item) => String(item).toLowerCase().trim() !== cleaned),
    );
  };

  const updateArtTransform = (patch: Partial<ArtTransform>) => {
    if (!art) return;
    const next = normalizeArtTransform({ ...artTransform, ...patch });
    props.onUpdateRow({ art: { ...art, transform: next } });
  };

  const resetArtTransform = () => {
    updateArtTransform({ x: 0, y: 0, scale: 1, rotate: 0, fit: 'cover' });
  };

  const customColumns = props.columns.filter((key) => !isReservedColumn(key));

  if (!row) {
    return <div className="empty">{t('cards.empty')}</div>;
  }

  return (
    <div className="uiStack">
      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.card')}</summary>
        <div className="uiAccordionBody uiStack">
          <div>
            <div className="uiHelp">{t('editor.inspector.template')}</div>
            <TemplatePicker
              value={templateKey}
              language={props.language}
              onChange={(next) => props.onUpdateData('templateKey', next)}
            />
          </div>
          <div>
            <div className="uiHelp">{t('cards.element')}</div>
            <Select
              value={element}
              onChange={(e) => props.onUpdateData('element', e.target.value || undefined)}
            >
              <option value="">{t('common.none')}</option>
              {Object.keys(ELEMENTS).map((key) => (
                <option key={key} value={key}>
                  {t(`elements.${key}`, { defaultValue: key })}
                </option>
              ))}
            </Select>
            {element ? (
              <div className="elementChips">
                <div className="elementChipGroup">
                  <div className="uiHelp">{t('elements.weakTo')}</div>
                  <div className="elementChipRow">
                    {matchup.weakTo.length ? matchup.weakTo.map((item) => (
                      <span key={`weak-${item}`} className="elementChip">
                        <span className="elementChipIcon">{ELEMENTS[item]?.icon ?? '•'}</span>
                        <span>{t(`elements.${item}`, { defaultValue: item })}</span>
                      </span>
                    )) : <span className="uiHelp">{t('common.none')}</span>}
                  </div>
                </div>
                <div className="elementChipGroup">
                  <div className="uiHelp">{t('elements.strongAgainst')}</div>
                  <div className="elementChipRow">
                    {matchup.strongAgainst.length ? matchup.strongAgainst.map((item) => (
                      <span key={`strong-${item}`} className="elementChip">
                        <span className="elementChipIcon">{ELEMENTS[item]?.icon ?? '•'}</span>
                        <span>{t(`elements.${item}`, { defaultValue: item })}</span>
                      </span>
                    )) : <span className="uiHelp">{t('common.none')}</span>}
                  </div>
                </div>
                <div className="elementChipGroup">
                  <div className="uiHelp">{t('elements.resist')}</div>
                  <div className="elementChipRow">
                    {matchup.resist.length ? matchup.resist.map((item) => (
                      <span key={`resist-${item}`} className="elementChip">
                        <span className="elementChipIcon">{ELEMENTS[item]?.icon ?? '•'}</span>
                        <span>{t(`elements.${item}`, { defaultValue: item })}</span>
                      </span>
                    )) : <span className="uiHelp">{t('common.none')}</span>}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div>
            <div className="uiHelp">{t('cards.meta.race')}</div>
            <Select
              value={race}
              onChange={(e) => props.onUpdateData('race', e.target.value || undefined)}
            >
              <option value="">{t('common.none')}</option>
              {RACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`races.${option}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="uiHelp">{t('cards.meta.traits')}</div>
            <div className="uiStack" style={{ gap: 8 }}>
              <Input
                placeholder={t('cards.search')}
                value={traitQuery}
                onChange={(e) => setTraitQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (traitSuggestions.length) {
                      addTrait(traitSuggestions[0]);
                    } else {
                      addTrait(traitQuery);
                    }
                  }
                }}
              />
              {traitSuggestions.length ? (
                <div className="traitsChips">
                  {traitSuggestions.map((trait) => {
                    const meta = TRAIT_META[trait];
                    const label = t(meta?.labelKey ?? `traits.${trait}`, { defaultValue: trait });
                    return (
                      <button
                        key={trait}
                        type="button"
                        className={`chip chip--suggestion ${meta ? `chip--${meta.tintClass}` : ''}`}
                        onClick={() => addTrait(trait)}
                      >
                        <span className="chipIcon">
                          <TraitIcon trait={trait} size={14} />
                        </span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="traitsChips">
                {traits.map((trait) => {
                  const key = String(trait);
                  const meta = TRAIT_META[key];
                  const label = t(meta?.labelKey ?? `traits.${key}`, { defaultValue: key });
                  return (
                    <span key={key} className={`chip ${meta ? `chip--${meta.tintClass}` : ''}`}>
                      <span className="chipIcon">
                        <TraitIcon trait={key} size={14} />
                      </span>
                      <span>{label}</span>
                      <button
                        type="button"
                        className="chipRemove"
                        onClick={() => removeTrait(key)}
                        aria-label={t('common.delete')}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <div className="uiHelp">{t('editor.inspector.rarity')}</div>
            <Select
              value={rarity}
              onChange={(e) => props.onUpdateData('rarity', e.target.value)}
            >
              {RARITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getRarityLabel(option, props.language)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="uiHelp">{t('editor.inspector.background')}</div>
            <Input value={bgColor} onChange={(e) => props.onUpdateData('bgColor', e.target.value)} />
          </div>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.stats')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('editor.inspector.attack')}</div>
              <Input
                type="number"
                value={attack}
                onChange={(e) => props.onUpdateStat('attack', Number(e.target.value) || 0)}
              />
            </div>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('editor.inspector.defense')}</div>
              <Input
                type="number"
                value={defense}
                onChange={(e) => props.onUpdateStat('defense', Number(e.target.value) || 0)}
              />
            </div>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('data.cost')}</div>
              <Input
                type="number"
                value={cost}
                onChange={(e) => props.onUpdateData('cost', Number(e.target.value) || 0)}
              />
            </div>
          </Row>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.text')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.name')} ({t('settings.english')})</div>
              <Input value={nameEn} onChange={(e) => props.onUpdateData('name.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.name')} ({t('settings.arabic')})</div>
              <Input value={nameAr} onChange={(e) => props.onUpdateData('name.ar', e.target.value)} />
            </div>
          </Row>
          <Row gap={10}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('editor.inspector.ability')} ({t('settings.english')})</div>
              <Input value={abilityEn} onChange={(e) => props.onUpdateData('desc.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('editor.inspector.ability')} ({t('settings.arabic')})</div>
              <Input value={abilityAr} onChange={(e) => props.onUpdateData('desc.ar', e.target.value)} />
            </div>
          </Row>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('ai.title')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runAi('name')}
              disabled={aiLoading !== null}
            >
              {aiLoading === 'name' ? t('ai.working') : t('ai.generateName')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runAi('desc')}
              disabled={aiLoading !== null}
            >
              {aiLoading === 'desc' ? t('ai.working') : t('ai.generateDesc')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runAi('balance')}
              disabled={aiLoading !== null}
            >
              {aiLoading === 'balance' ? t('ai.working') : t('ai.suggestBalance')}
            </Button>
          </Row>
          {aiError ? <div className="uiHelp">{aiError}</div> : null}
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.media')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={8}>
            <Button variant="outline" size="sm" onClick={props.onPickImage}>{t('data.uploadImage')}</Button>
            <Button variant="outline" size="sm" onClick={props.onPickVideo}>{t('data.uploadVideo')}</Button>
          </Row>
          <div className="uiHelp">
            {art?.kind === 'video'
              ? t('data.videoUsesPoster')
              : art?.kind === 'image'
                ? t('data.imageSelected')
                : t('data.noArtwork')}
          </div>
          {videoMeta ? (
            <div className="uiHelp">
              {t('data.videoDetails')}: {formatVideoMeta(videoMeta)}
            </div>
          ) : null}
          <div className="uiHelp">{t('ui.tip.videoPoster')}</div>
          <Row gap={8}>
            <Button variant="outline" size="sm" onClick={props.onRegeneratePoster} disabled={!art || art.kind !== 'video'}>
              {t('data.generatePoster')}
            </Button>
            <Toggle
              checked={props.showVideoControls}
              onChange={props.onToggleVideoControls}
              label={t('data.showVideoControls')}
            />
            <Toggle
              checked={props.keepVideoAudio}
              onChange={props.onToggleKeepVideoAudio}
              label={t('data.keepVideoAudio')}
            />
          </Row>
          {art ? (
            <div className="uiStack" style={{ gap: 10 }}>
              <div className="uiHelp">{t('cards.art.dragHint')}</div>
              <Row gap={10} align="end" style={{ flexWrap: 'wrap' }}>
                <div style={{ minWidth: 120 }}>
                  <div className="uiHelp">{t('editor.fit')}</div>
                  <Select
                    value={artTransform.fit}
                    onChange={(e) => updateArtTransform({ fit: e.target.value as ArtTransform['fit'] })}
                  >
                    <option value="cover">{t('fit.cover')}</option>
                    <option value="contain">{t('fit.contain')}</option>
                  </Select>
                </div>
                <div style={{ minWidth: 160 }}>
                  <div className="uiHelp">{t('editor.zoom')}</div>
                  <Input
                    type="range"
                    min={0.6}
                    max={2.5}
                    step={0.05}
                    value={artTransform.scale}
                    onChange={(e) => updateArtTransform({ scale: Number(e.target.value) || 1 })}
                  />
                </div>
                <div style={{ minWidth: 160 }}>
                  <div className="uiHelp">{t('editor.rotation')}</div>
                  <Input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={artTransform.rotate}
                    onChange={(e) => updateArtTransform({ rotate: Number(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ minWidth: 90 }}>
                  <div className="uiHelp">X</div>
                  <Input
                    type="number"
                    value={Math.round(artTransform.x)}
                    onChange={(e) => updateArtTransform({ x: Number(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ minWidth: 90 }}>
                  <div className="uiHelp">Y</div>
                  <Input
                    type="number"
                    value={Math.round(artTransform.y)}
                    onChange={(e) => updateArtTransform({ y: Number(e.target.value) || 0 })}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={resetArtTransform}>
                  {t('common.reset')}
                </Button>
              </Row>
            </div>
          ) : null}
        </div>
      </details>

      <Dialog
        open={confirmBalanceOpen && !!balanceSuggestion}
        title={t('ai.confirmBalanceTitle')}
        description={
          balanceSuggestion
            ? t('ai.confirmBalanceDesc', {
                attack: balanceSuggestion.attack,
                defense: balanceSuggestion.defense,
                cost: balanceSuggestion.cost,
              })
            : undefined
        }
        confirmText={t('ai.confirm')}
        cancelText={t('ai.cancel')}
        tone="danger"
        onConfirm={() => {
          if (!balanceSuggestion) return;
          props.onUpdateStat('attack', balanceSuggestion.attack);
          props.onUpdateStat('defense', balanceSuggestion.defense);
          props.onUpdateData('cost', balanceSuggestion.cost);
          setConfirmBalanceOpen(false);
          setBalanceSuggestion(null);
        }}
        onClose={() => {
          setConfirmBalanceOpen(false);
          setBalanceSuggestion(null);
        }}
      />

      <details className="uiAccordion">
        <summary className="uiAccordionHeader">{t('cards.advanced')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={8}>
            <Badge>{t('editor.inspector.attack')}: {attack}</Badge>
            <Badge>{t('editor.inspector.defense')}: {defense}</Badge>
            <Badge>Total: {total}</Badge>
            {missingPoster ? <Badge variant="warn">{t('data.posterRequired')}</Badge> : null}
            {missingFields ? <Badge variant="warn">{t('export.missingFields', { count: 1 })}</Badge> : null}
          </Row>
          <Divider />
          <div>
            <div className="uiHelp">ID</div>
            <Input value={props.row.id} readOnly />
          </div>
          <Row gap={10}>
            <div style={{ minWidth: 160, flex: 1 }}>
              <div className="uiHelp">{t('data.setColumn')}</div>
              <Select
                value={props.row.setId ?? props.project.sets[0]?.id}
                onChange={(e) => props.onUpdateRow({ setId: e.target.value })}
              >
                {props.project.sets.map((set) => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </Select>
            </div>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('data.quantityColumn')}</div>
              <Input
                type="number"
                min={1}
                value={props.row.quantity ?? 1}
                onChange={(e) => props.onUpdateRow({ quantity: Number(e.target.value) || 1 })}
              />
            </div>
          </Row>
          <div>
            <div className="uiHelp">{t('cards.tag')}</div>
            <Input value={tagsValue} onChange={(e) => props.onUpdateData('tags', e.target.value)} />
          </div>
          {customColumns.length ? (
            <div className="uiStack">
              <div className="uiHelp">Fields</div>
              {customColumns.map((key) => (
                <div key={key}>
                  <div className="uiHelp">{key}</div>
                  <Input
                    value={String(resolvePath(data, key) ?? '')}
                    onChange={(e) => props.onUpdateData(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : null}
          <Row gap={8}>
            <Button size="sm" variant="outline" onClick={props.onDuplicate}>{t('cards.duplicate')}</Button>
            <Button size="sm" variant="danger" onClick={props.onDelete}>{t('common.delete')}</Button>
          </Row>
        </div>
      </details>
    </div>
  );
}

function getLocalizedValue(value: any, language: 'en' | 'ar') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[language] ?? value.en ?? value.ar ?? '');
  }
  return value == null ? '' : String(value);
}

function hasLocalizedValue(value: any) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    const record = value as Record<string, any>;
    return Boolean(String(record.en ?? '').trim() || String(record.ar ?? '').trim());
  }
  return Boolean(value);
}

function normalizeTemplateKey(value: any): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned && Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)) {
    return cleaned as TemplateKey;
  }
  return 'classic';
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned as Rarity;
  return 'common';
}

function normalizeRace(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (!cleaned) return '';
  return cleaned as CardRace;
}

function normalizeElement(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (!cleaned) return '';
  return cleaned as ElementKey;
}

function normalizeTraits(value: any) {
  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).toLowerCase().trim()).filter(Boolean) as CardTrait[];
  }
  const raw = String(value || '').trim();
  if (!raw) return [] as CardTrait[];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean) as CardTrait[];
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRarityLabel(rarity: Rarity, language: 'en' | 'ar') {
  const labels = {
    common: { en: 'Common', ar: 'عادي' },
    rare: { en: 'Rare', ar: 'نادر' },
    epic: { en: 'Epic', ar: 'ملحمي' },
    legendary: { en: 'Legendary', ar: 'أسطوري' },
  } as const;
  return labels[rarity][language] ?? labels[rarity].en;
}

function isReservedColumn(key: string) {
  const reserved = [
    'name',
    'desc',
    'ability',
    'attack',
    'defense',
    'rarity',
    'template',
    'templateKey',
    'bgColor',
    'cost',
    'element',
    'race',
    'traits',
    'tags',
    'stats',
    'id',
  ];
  return reserved.some((field) => key === field || key.startsWith(`${field}.`));
}

function formatVideoMeta(meta?: CardArtVideoMeta) {
  if (!meta) return '';
  const codec = meta.videoCodec ? normalizeCodec(meta.videoCodec) : '';
  const resolution = meta.width && meta.height ? `${Math.round(meta.width)}x${Math.round(meta.height)}` : '';
  const duration = meta.duration ? `${meta.duration.toFixed(1)}s` : '';
  const size = meta.size ? formatBytes(meta.size) : '';
  const parts = [codec, resolution, duration, size].filter(Boolean);
  return parts.join(' • ');
}

function normalizeCodec(codec: string) {
  const cleaned = codec.toLowerCase();
  if (cleaned === 'h264') return 'H.264';
  if (cleaned === 'hevc' || cleaned === 'h265') return 'H.265';
  if (cleaned === 'vp9') return 'VP9';
  if (cleaned === 'av1') return 'AV1';
  return codec.toUpperCase();
}

function formatBytes(size: number) {
  if (!Number.isFinite(size)) return '';
  const mb = size / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)}MB`;
  const kb = size / 1024;
  return `${kb.toFixed(0)}KB`;
}

function normalizeArtTransform(value?: ArtTransform): ArtTransform {
  const scale = Number.isFinite(value?.scale) ? value!.scale : 1;
  const rotate = Number.isFinite(value?.rotate) ? value!.rotate : 0;
  return {
    x: Number.isFinite(value?.x) ? value!.x : 0,
    y: Number.isFinite(value?.y) ? value!.y : 0,
    scale: Math.min(2.5, Math.max(0.6, scale)),
    rotate: Math.max(-180, Math.min(180, rotate)),
    fit: value?.fit === 'contain' ? 'contain' : 'cover',
  };
}
