import React from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, Select } from '../../components/ui';

export function SettingsScreen() {
  const { t, i18n } = useTranslation();

  return (
    <div className="screen" style={{ padding: 16 }}>
      <Panel title={t('settings.title')} subtitle={t('settings.subtitle')}>
        <div className="settings-grid">
          <div>
            <div className="hint">{t('settings.languageLabel')}</div>
            <Select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">{t('settings.english')}</option>
              <option value="ar">{t('settings.arabic')}</option>
            </Select>
            <div className="hint" style={{ marginTop: 6 }}>
              {t('settings.languageHint')}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
