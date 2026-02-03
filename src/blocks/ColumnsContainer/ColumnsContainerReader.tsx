import React, { CSSProperties } from 'react';

import { ReaderBlock, useReaderDocument } from '../../Reader/core';

import { ColumnsContainerProps } from './ColumnsContainerPropsSchema';

const STRETCH_BLOCK_TYPES = ['Heading', 'Text', 'Container'];

const CONTENT_ALIGNMENT_MAP: Record<string, 'flex-start' | 'center' | 'flex-end' | 'stretch'> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
  stretch: 'stretch',
};

const COLUMN_WORD_WRAP: CSSProperties = {
  wordWrap: 'break-word',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
};

/** 不等分比例时：小列 0 0 X%，大列 flex: 1 1 0 铺满剩余；数值 <=100 视为百分比 */
function getColumnFlex(
  fixedWidths: [number | null | undefined, number | null | undefined, number | null | undefined, number | null | undefined] | null | undefined,
  index: number,
  count: number
): string {
  const fixedW = fixedWidths?.[index];
  if (fixedW == null) return '1 1 0';
  const inUse = (fixedWidths ? Array.from(fixedWidths) : []).slice(0, count).filter((v): v is number => v != null);
  const usePercentage = inUse.length > 0 && inUse.every((v) => v <= 100);
  if (usePercentage) {
    const maxVal = Math.max(...inUse);
    if (fixedW === maxVal) return '1 1 0';
    return `0 0 ${fixedW}%`;
  }
  return `0 0 ${fixedW}px`;
}

export default function ColumnsContainerReader({ style, props }: ColumnsContainerProps) {
  const document = useReaderDocument();
  const { columns, columnsCount, ...restProps } = props ?? {};
  const count = columnsCount ?? (columns?.length ?? 3);
  const columnsGap = (restProps && 'columnsGap' in restProps) ? restProps.columnsGap ?? 0 : 0;
  const contentAlignment = (restProps && 'contentAlignment' in restProps) ? restProps.contentAlignment ?? 'middle' : 'middle';
  const fixedWidths = (restProps && 'fixedWidths' in restProps) ? restProps.fixedWidths : undefined;
  const isStretch = contentAlignment === 'stretch';

  let cols: React.ReactNode[] | undefined;
  if (columns) {
    cols = columns.map((col) =>
      col.childrenIds.map((childId) => {
        const blockType = document[childId]?.type;
        const content = <ReaderBlock key={childId} id={childId} />;
        if (isStretch && blockType && STRETCH_BLOCK_TYPES.includes(blockType)) {
          return (
            <div
              key={childId}
              data-stretch-block-wrapper="true"
              style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              {content}
            </div>
          );
        }
        return content;
      })
    );
  }
  const wStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    padding: style?.padding
      ? `${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px`
      : undefined,
    ...(isStretch && { height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }),
  };

  const alignItems = CONTENT_ALIGNMENT_MAP[contentAlignment] ?? 'center';
  const flexRowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: columnsGap,
    alignItems,
    ...(isStretch && { flex: 1, minHeight: 0, alignSelf: 'stretch' }),
  };

  return (
    <div style={wStyle}>
      <div style={flexRowStyle}>
        {cols?.map((col, index) => {
          if (index >= count) return null;
          const flexVal = getColumnFlex(fixedWidths, index, count);
          const flexStyle: CSSProperties = {
            boxSizing: 'content-box',
            flex: flexVal,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            ...(isStretch
              ? { minHeight: 0, alignSelf: 'stretch' }
              : { justifyContent: (CONTENT_ALIGNMENT_MAP[contentAlignment] ?? 'center') as 'flex-start' | 'center' | 'flex-end' }),
            ...COLUMN_WORD_WRAP,
          };
          return (
            <div key={index} style={flexStyle}>
              {isStretch ? (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  {col}
                </div>
              ) : (
                col
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
