import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { BUILD_INFO } from '../constants/build';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import { iconForStyle } from '../utils/icons';

function InfoRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  const { theme, settings } = useAppPreferences();

  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${theme.colors.primary}16`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={iconForStyle(icon, settings.iconStyle) as never} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{title}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{body}</Text>
      </View>
    </View>
  );
}

function LinkRow({ icon, title }: { icon: string; title: string }) {
  const { theme, settings } = useAppPreferences();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
      <Ionicons name={iconForStyle(icon, settings.iconStyle) as never} size={19} color={theme.colors.textMuted} />
      <Text style={{ flex: 1, color: theme.colors.text, fontSize: 15, fontWeight: '800' }}>{title}</Text>
      <Ionicons name={iconForStyle('chevron-forward-outline', settings.iconStyle) as never} size={18} color={theme.colors.textMuted} />
    </View>
  );
}

export function AboutScreen() {
  const { theme } = useAppPreferences();
  const { t } = useI18n();

  return (
    <Screen>
      <ScreenHeader title={t('about.title')} subtitle={t('about.subtitle')} />

      <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 22, backgroundColor: `${theme.colors.primary}10` }}>
        <Image source={require('../../assets/icon.png')} style={{ width: 78, height: 78, borderRadius: 18 }} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '900' }}>{t('about.appName')}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>
            {t('about.appVersion')}: {BUILD_INFO.appVersion}
          </Text>
          <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '900' }}>{BUILD_INFO.label}</Text>
        </View>
      </Card>

      <SectionHeader title={t('about.versionDetails')} />
      <Card style={{ gap: 12 }}>
        <InfoRow icon="pricetag-outline" title={t('about.appVersion')} body={BUILD_INFO.appVersion} />
        <InfoRow icon="sparkles-outline" title={t('about.buildLabelTitle')} body={BUILD_INFO.label} />
        <InfoRow icon="git-branch-outline" title={t('about.buildId')} body={BUILD_INFO.buildId} />
        <InfoRow icon="calendar-outline" title={t('about.buildDate')} body={BUILD_INFO.buildDate} />
      </Card>

      <SectionHeader title={t('about.whatItDoes')} />
      <Card style={{ gap: 16 }}>
        <InfoRow icon="information-circle-outline" title={t('about.descriptionTitle')} body={t('about.descriptionBody')} />
        <InfoRow icon="wallet-outline" title={t('about.featureLedger')} body={t('about.featureLedgerBody')} />
        <InfoRow icon="bar-chart-outline" title={t('about.featureReports')} body={t('about.featureReportsBody')} />
        <InfoRow icon="color-palette-outline" title={t('about.featureThemes')} body={t('about.featureThemesBody')} />
        <InfoRow icon="download-outline" title={t('about.exportFeature')} body={t('about.exportFeatureBody')} />
      </Card>

      <SectionHeader title={t('about.dataPrivacy')} />
      <Card style={{ gap: 16 }}>
        <InfoRow icon="phone-portrait-outline" title={t('about.offlineFirst')} body={t('about.offlineFirstBody')} />
        <InfoRow icon="shield-checkmark-outline" title={t('about.privacy')} body={t('about.privacyBody')} />
        <InfoRow icon="archive-outline" title={t('about.backup')} body={t('about.backupBody')} />
      </Card>

      <SectionHeader title={t('about.supportLegal')} />
      <Card style={{ gap: 12 }}>
        <InfoRow icon="business-outline" title={t('about.publisher')} body={t('about.publisherBody')} />
        <LinkRow icon="mail-outline" title={t('about.supportEmail')} />
        <LinkRow icon="document-lock-outline" title={t('about.privacyPolicy')} />
        <LinkRow icon="document-text-outline" title={t('about.terms')} />
        <InfoRow icon="alert-circle-outline" title={t('about.disclaimerTitle')} body={t('about.disclaimerBody')} />
      </Card>

      <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
        {t('about.footer')}
      </Text>
    </Screen>
  );
}
