import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { colors } from "../../constants/colors";
import { spacing, radius, accent, surfaces } from "../../constants/theme";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  suggestionsTitle?: string;
}

/**
 * Chip-based multi-value input. Users add free-text tags and/or tap curated
 * suggestion chips. Used for the tasting note Nose / Finish steps in place of the
 * old comma-separated text field.
 */
export default function TagInput({
  tags,
  onChange,
  placeholder,
  suggestions = [],
  suggestionsTitle,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    onChange([...tags, value]);
  };

  const removeTag = (value: string) => {
    onChange(tags.filter((t) => t !== value));
  };

  const submitDraft = () => {
    addTag(draft);
    setDraft("");
  };

  const remainingSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submitDraft}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.addButton, !draft.trim() && styles.addButtonDisabled]}
          onPress={submitDraft}
          disabled={!draft.trim()}
        >
          <Icon name="add" size={22} color={accent.onAccent} />
        </TouchableOpacity>
      </View>

      {tags.length > 0 && (
        <View style={styles.tagWrap}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => removeTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagText}>{tag}</Text>
              <Icon name="close" size={14} color={accent.text} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {remainingSuggestions.length > 0 && (
        <View style={styles.suggestionBlock}>
          {suggestionsTitle ? (
            <Text style={styles.suggestionTitle}>{suggestionsTitle}</Text>
          ) : null}
          <View style={styles.tagWrap}>
            {remainingSuggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => addTag(s)}
                activeOpacity={0.7}
              >
                <Icon
                  name="add"
                  size={13}
                  color={colors.textSecondary}
                  style={styles.suggestionIcon}
                />
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: surfaces.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: surfaces.hairline,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    backgroundColor: accent.base,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: surfaces.card,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: accent.soft,
    borderWidth: 1,
    borderColor: accent.border,
  },
  tagText: {
    color: accent.text,
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionBlock: {
    marginTop: spacing.xl,
  },
  suggestionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: surfaces.card,
    borderWidth: 1,
    borderColor: surfaces.hairline,
  },
  suggestionIcon: {
    marginRight: spacing.xs,
  },
  suggestionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
