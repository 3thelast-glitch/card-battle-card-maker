import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BaseTraitKey, DerivedTraitKey } from '../../lib/traits/traits.types';
import { BASE_TRAITS, DERIVED_TRAITS, TRAIT_META } from '../../lib/traits/traits.registry';

type Props = {
  baseTraits: BaseTraitKey[];
  derivedTraits: DerivedTraitKey[];
  onChange: (next: BaseTraitKey[]) => void;
};

export function TraitSelector({ baseTraits, derivedTraits, onChange }: Props) {
  const { t } = useTranslation();
  const selected = useMemo(() => new Set(baseTraits), [baseTraits]);

  const toggleTrait = (trait: BaseTraitKey) => {
    if (selected.has(trait)) {
      onChange(baseTraits.filter((item) => item !== trait));
      return;
    }
    onChange([...baseTraits, trait]);
  };

  return (
    <div className="traitSelector">
      <div className="uiHelp">{t('traitSystem.baseTitle')}</div>
      <div className="traitOptions">
        {BASE_TRAITS.map((trait) => {
          const meta = TRAIT_META[trait];
          const active = selected.has(trait);
          return (
            <button
              key={trait}
              type="button"
              className={`traitOption ${active ? 'isActive' : ''}`}
              onClick={() => toggleTrait(trait)}
            >
              <span className="traitOptionIcon">{meta.icon}</span>
              <span>{t(meta.labelKey, { defaultValue: trait })}</span>
            </button>
          );
        })}
      </div>

      <div className="uiHelp">{t('traitSystem.derivedTitle')}</div>
      <div className="traitOptions traitOptions--derived">
        {(derivedTraits.length ? derivedTraits : DERIVED_TRAITS).map((trait) => {
          const meta = TRAIT_META[trait];
          const active = derivedTraits.includes(trait);
          return (
            <span key={trait} className={`traitOption isDerived ${active ? 'isActive' : ''}`}>
              <span className="traitOptionIcon">{meta.icon}</span>
              <span>{t(meta.labelKey, { defaultValue: trait })}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
