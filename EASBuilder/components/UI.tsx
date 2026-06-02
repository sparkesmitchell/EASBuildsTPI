import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing } from '@/lib/theme';

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const bg = {
    primary: Colors.accent,
    secondary: Colors.bgCardAlt,
    danger: Colors.redDim,
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: Colors.white,
    secondary: Colors.textSecondary,
    danger: Colors.redText,
    ghost: Colors.textSecondary,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        variant === 'secondary' && { borderWidth: 0.5, borderColor: Colors.border },
        variant === 'ghost' && { borderWidth: 0.5, borderColor: Colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

type BuildStatus = 'NEW' | 'IN_QUEUE' | 'IN_PROGRESS' | 'FINISHED' | 'ERRORED' | 'CANCELED';

const STATUS_CONFIG: Record<BuildStatus, { bg: string; text: string; label: string; dot: string }> = {
  NEW:         { bg: Colors.bgCardAlt, text: Colors.textSecondary, label: 'New',         dot: Colors.textTertiary },
  IN_QUEUE:    { bg: Colors.amberDim,  text: Colors.amberText,     label: 'Queued',      dot: Colors.amber },
  IN_PROGRESS: { bg: Colors.accentDim, text: Colors.accentText,    label: 'Building',    dot: Colors.accent },
  FINISHED:    { bg: Colors.greenDim,  text: Colors.greenText,     label: 'Finished',    dot: Colors.green },
  ERRORED:     { bg: Colors.redDim,    text: Colors.redText,       label: 'Failed',      dot: Colors.red },
  CANCELED:    { bg: Colors.bgCardAlt, text: Colors.textSecondary, label: 'Cancelled',   dot: Colors.textTertiary },
};

export function StatusBadge({ status }: { status: BuildStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NEW;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ── Row item (tap-able list row) ───────────────────────────────────────────────

export function RowItem({
  onPress,
  left,
  center,
  right,
  selected,
  style,
}: {
  onPress?: () => void;
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  selected?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.rowItem,
        selected && { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
        style,
      ]}
    >
      {left && <View style={{ marginRight: 12 }}>{left}</View>}
      <View style={{ flex: 1 }}>{center}</View>
      {right && <View style={{ marginLeft: 8 }}>{right}</View>}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  empty: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
