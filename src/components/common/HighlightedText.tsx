import React from "react";
import { Text, TextProps, StyleProp, TextStyle } from "react-native";

interface HighlightedTextProps extends TextProps {
  text: string;
  query: string;
  highlightStyle?: StyleProp<TextStyle>;
}

/**
 * 검색어와 겹치는 부분을 자동으로 강조(기본: 볼드)해서 렌더링한다.
 * 대소문자 구분 없이 등장하는 모든 위치를 강조하며, query가 비어 있으면
 * 일반 Text와 동일하게 동작한다. (검색 자동완성 리스트용)
 */
export default function HighlightedText({
  text,
  query,
  highlightStyle,
  ...rest
}: HighlightedTextProps) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <Text {...rest}>{text}</Text>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const segments: { str: string; hit: boolean }[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQuery, cursor);
    if (idx === -1) {
      segments.push({ str: text.slice(cursor), hit: false });
      break;
    }
    if (idx > cursor) {
      segments.push({ str: text.slice(cursor, idx), hit: false });
    }
    segments.push({ str: text.slice(idx, idx + lowerQuery.length), hit: true });
    cursor = idx + lowerQuery.length;
  }

  return (
    <Text {...rest}>
      {segments.map((segment, index) =>
        segment.hit ? (
          <Text key={index} style={highlightStyle ?? styles.bold}>
            {segment.str}
          </Text>
        ) : (
          segment.str
        )
      )}
    </Text>
  );
}

const styles = {
  bold: { fontWeight: "800" as const },
};
