import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, Text, View, type ViewStyle } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionHeader } from '../components/SectionHeader';
import { BUILD_INFO } from '../constants/build';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';

function InfoRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  const { theme } = useAppPreferences();

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
        <Ionicons name={icon as never} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '900' }}>{title}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{body}</Text>
      </View>
    </View>
  );
}

export function AboutScreen() {
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const softCardStyle = Platform.select({
    web: { boxShadow: `0 1px 5px ${theme.colors.shadow}08` } as ViewStyle,
    default: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 5,
      elevation: 1,
    },
  });
  return (
    <Screen>
      <ScreenHeader title={t('about.title')} subtitle={t('about.subtitle')} />

      <Card
        style={{
          ...softCardStyle,
          alignItems: 'center',
          gap: 10,
          paddingVertical: 18,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <Image source={require('../../assets/icon.png')} style={{ width: 70, height: 70, borderRadius: 16 }} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '900' }}>{t('about.appName')}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '800' }}>
            {t('about.appVersion')}: {BUILD_INFO.appVersion}
          </Text>
          <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '900' }}>{BUILD_INFO.label}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
            {t('about.buildId')}: {BUILD_INFO.buildId}
          </Text>
        </View>
      </Card>

      <SectionHeader title={t('about.dataPrivacy')} />
      <Card style={{ ...softCardStyle, gap: 16 }}>
        <InfoRow icon="phone-portrait-outline" title={t('about.offlineFirst')} body={t('about.offlineFirstBody')} />
        <InfoRow icon="shield-checkmark-outline" title={t('about.privacy')} body={t('about.privacyBody')} />
        <InfoRow icon="archive-outline" title={t('about.backup')} body={t('about.backupBody')} />
      </Card>

      <SectionHeader title={t('about.supportLegal')} />
      <Card style={{ ...softCardStyle, gap: 12 }}>
        <InfoRow icon="business-outline" title={t('about.publisher')} body={t('about.publisherBody')} />
        <InfoRow icon="mail-outline" title={t('settings.support')} body={t('about.supportEmail')} />
        <InfoRow icon="document-lock-outline" title={t('about.privacyPolicy')} body={t('about.privacyPolicyBody')} />
        <InfoRow icon="document-text-outline" title={t('about.terms')} body={t('about.termsBody')} />
        <InfoRow icon="alert-circle-outline" title={t('about.disclaimerTitle')} body={t('about.disclaimerBody')} />
        <InfoRow icon="shield-checkmark-outline" title={t('about.playProtectTitle')} body={t('about.playProtectBody')} />
      </Card>

      <Text style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
        {t('about.footer')}
      </Text>
    </Screen>
  );
}
