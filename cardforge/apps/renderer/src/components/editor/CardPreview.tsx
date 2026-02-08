import { useTranslation } from 'react-i18next';
import type { TraitKey } from '../../lib/traits/traits.types';
import { TRAIT_META } from '../../lib/traits/traits.registry';

type Props = {
  attack: number;
  defense: number;
  traits: TraitKey[];
};

export function CardPreview({ attack, defense, traits }: Props) {
  const { t } = useTranslation();

  return (
    <div className="traitPreview">
      <div className="traitPreviewStats">
        <div className="traitStat">
          <div className="traitStatValue">{attack}</div>
          <div className="traitStatLabel">{t('stats.atk', { defaultValue: 'ATK' })}</div>
        </div>
        <div className="traitStat">
          <div className="traitStatValue">{defense}</div>
          <div className="traitStatLabel">{t('stats.def', { defaultValue: 'DEF' })}</div>
        </div>
      </div>
      <div className="traitPreviewList">
        {traits.length ? (
          traits.map((trait) => {
            const meta = TRAIT_META[trait];
            return (
              <span key={trait} className="traitPreviewBadge">
                <span className="traitPreviewIcon">{meta?.icon ?? '*'}</span>
                <span>{t(meta?.labelKey ?? `traits.${trait}`, { defaultValue: trait })}</span>
              </span>
            );
          })
        ) : (
          <span className="uiHelp">{t('common.none')}</span>
        )}
      </div>
    </div>
  );
}

