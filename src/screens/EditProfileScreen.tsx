import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../i18n/useI18n';
import type { Gender, PlanType } from '../types';

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'GU';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function isValidDateInput(value: string) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { theme, profile, updateProfile } = useAppPreferences();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [mobileNumber, setMobileNumber] = useState(profile.mobileNumber);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [planType, setPlanType] = useState<PlanType>(profile.planType);
  const [profileImageUri, setProfileImageUri] = useState(profile.profileImageUri ?? '');

  const chooseImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(t('profile.imagePickFailed'));
    }
  };

  const save = async () => {
    if (!isValidDateInput(dateOfBirth.trim())) {
      Alert.alert(t('profile.invalidDob'));
      return;
    }

    await updateProfile({
      displayName,
      dateOfBirth: dateOfBirth.trim(),
      mobileNumber,
      gender,
      planType,
      profileImageUri: profileImageUri || null,
    });
    navigation.goBack();
  };

  const genderOptions = [
    { label: t('profile.genderMale'), value: 'male' as Gender, icon: 'male-outline' },
    { label: t('profile.genderFemale'), value: 'female' as Gender, icon: 'female-outline' },
    { label: t('profile.genderOther'), value: 'other' as Gender, icon: 'person-outline' },
    { label: t('profile.genderPreferNot'), value: 'prefer_not_to_say' as Gender, icon: 'remove-circle-outline' },
  ];
  const planOptions = [
    { label: t('profile.free'), value: 'free' as PlanType, icon: 'leaf-outline', color: theme.colors.success },
    { label: t('profile.pro'), value: 'pro' as PlanType, icon: 'diamond-outline', color: theme.colors.accent },
  ];

  return (
    <Screen>
      <ScreenHeader title={t('profile.editTitle')} subtitle={t('profile.editSubtitle')} />

      <Card style={{ alignItems: 'center', gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          onPress={chooseImage}
          style={({ pressed }) => ({
            width: 104,
            height: 104,
            borderRadius: 52,
            overflow: 'hidden',
            backgroundColor: pressed ? theme.colors.surfaceElevated : `${theme.colors.primary}18`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${theme.colors.primary}40`,
          })}
        >
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ color: theme.colors.primary, fontSize: 28, fontWeight: '900' }}>{initials(displayName)}</Text>
          )}
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AppButton title={t('profile.chooseImage')} icon="image-outline" variant="secondary" onPress={chooseImage} />
          {profileImageUri ? (
            <AppButton title="" icon="trash-outline" variant="ghost" onPress={() => setProfileImageUri('')} style={{ width: 46, paddingHorizontal: 0 }} />
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name="phone-portrait-outline" size={15} color={theme.colors.textMuted} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>{t('profile.localOnly')}</Text>
        </View>
      </Card>

      <Card style={{ gap: 14 }}>
        <TextField label={t('profile.name')} value={displayName} onChangeText={setDisplayName} placeholder={t('profile.namePlaceholder')} />
        <TextField
          label={t('profile.dateOfBirth')}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
        />
        <TextField
          label={t('profile.mobileNumber')}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder={t('profile.mobilePlaceholder')}
          keyboardType="phone-pad"
        />
        <SelectField label={t('profile.gender')} value={gender} onChange={setGender} options={genderOptions} icon="person-outline" />
        <SelectField label={t('profile.planType')} value={planType} onChange={setPlanType} options={planOptions} icon="diamond-outline" />
      </Card>

      <AppButton title={t('common.save')} icon="checkmark-outline" onPress={save} />
    </Screen>
  );
}
