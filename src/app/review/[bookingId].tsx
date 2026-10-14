import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBooking, useCreateReview } from '@/api/queries';
import { Stars } from '@/components/stars';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, LoadingView } from '@/components/ui/state-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/lib/errors';
import { useAppSettings } from '@/state/app-settings';
import { spacing } from '@/theme/tokens';

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { t } = useAppSettings();
  const { data: b, isPending } = useBooking(bookingId);
  const create = useCreateReview();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  if (isPending) return <Screen edges={['bottom']}><LoadingView /></Screen>;
  if (!b) return <Screen edges={['bottom']}><EmptyView title={t.ticket.notFound} /></Screen>;
  if (b.myReview || create.isSuccess) {
    return (
      <Screen edges={['bottom']}>
        <EmptyView title={t.review.thanks} action={<Stars value={b.myReview?.rating ?? rating} size={28} />} />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <Text variant="h2">{b.event.title}</Text>
        <Text color="textMuted">{b.event.host.name}</Text>
        <View style={styles.stars}>
          <Stars value={rating} size={40} onChange={setRating} />
        </View>
        <TextField placeholder={t.review.placeholder} value={text} onChangeText={setText} multiline maxLength={1000} />
        {create.error ? <Text variant="caption" color="danger">{errorMessage(create.error, t)}</Text> : null}
        <Button
          title={t.review.send}
          disabled={rating === 0}
          loading={create.isPending}
          onPress={() => create.mutate({ eventId: b.eventId, rating, text }, { onSuccess: () => setTimeout(() => router.back(), 900) })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, paddingTop: spacing.xl },
  stars: { alignItems: 'center', paddingVertical: spacing.lg },
});
