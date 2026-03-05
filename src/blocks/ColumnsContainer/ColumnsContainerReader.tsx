import React, { CSSProperties } from 'react';

import { ReaderBlock, useReaderDocument } from '../../Reader/core';

import { ColumnsContainerProps } from './ColumnsContainerPropsSchema';

const STRETCH_BLOCK_TYPES = ['Heading', 'Text', 'Container'];

// 垂直对齐映射：table 的 valign 属性
const VERTICAL_ALIGNMENT_MAP: Record<'top' | 'middle' | 'bottom' | 'stretch', 'top' | 'middle' | 'bottom'> = {
  top: 'top',
  middle: 'middle',
  bottom: 'bottom',
  stretch: 'top', // stretch 模式需要特殊处理
};

const COLUMN_WORD_WRAP: CSSProperties = {
  wordWrap: 'break-word',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
};

/** 计算列的宽度（用于 table 布局） */
function getColumnWidth(
  fixedWidths: [number | null | undefined, number | null | undefined, number | null | undefined, number | null | undefined] | null | undefined,
  index: number,
  columnsCount: number
): string {
  const fixedW = fixedWidths?.[index];

  // 如果没有固定宽度，均分所有列
  if (fixedW == null) {
    // 计算每列的宽度百分比
    const equalWidth = 100 / columnsCount;
    // 最后一列使用剩余宽度，确保总和为 100%
    if (index === columnsCount - 1) {
      const previousColumnsWidth = equalWidth * (columnsCount - 1);
      const remainingWidth = 100 - previousColumnsWidth;
      return `${remainingWidth.toFixed(2)}%`;
    }
    return `${equalWidth.toFixed(2)}%`;
  }

  const inUse = (fixedWidths ?? []).slice(0, columnsCount).filter((v): v is number => v != null);
  const usePercentage = inUse.length > 0 && inUse.every((v) => v <= 100);

  if (usePercentage) {
    const maxVal = Math.max(...inUse);
    if (fixedW === maxVal) {
      // 大列铺满剩余，计算剩余百分比
      const fixedTotal = inUse.filter((v) => v !== maxVal).reduce((sum, v) => sum + v, 0);
      const remainingPercent = 100 - fixedTotal;
      return `${remainingPercent.toFixed(2)}%`;
    }
    return `${fixedW}%`;
  }
  return `${fixedW}px`;
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
              style={{ height: '100%', minHeight: 0, width: '100%' }}
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
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: style?.backgroundColor ?? undefined,
    padding: style?.padding
      ? `${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px`
      : undefined,
  };

  // 计算列间距的 padding（左右各一半）
  const gapPadding = columnsGap / 2;
  const valign = VERTICAL_ALIGNMENT_MAP[contentAlignment] ?? 'middle';

  return (
    <div style={wStyle}>
      <table
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        border={0}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          display: 'table',
        }}
      >
        <tbody>
          <tr>
            {cols?.map((col, index) => {
              if (index >= count) return null;

              const columnWidth = getColumnWidth(fixedWidths, index, count);

              // 计算 padding：第一列只有右边距，最后一列只有左边距，中间列左右都有
              const paddingLeft = index === 0 ? 0 : gapPadding;
              const paddingRight = index === count - 1 ? 0 : gapPadding;

              const tdStyle: CSSProperties = {
                width: columnWidth,
                padding: `0 ${paddingRight}px 0 ${paddingLeft}px`,
                verticalAlign: valign,
                ...COLUMN_WORD_WRAP,
              };

              // 如果是 stretch 模式，需要嵌套 table 来实现高度拉伸
              if (isStretch) {
                return (
                  <td
                    key={index}
                    width={columnWidth}
                    valign="top"
                    style={tdStyle}
                  >
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      border={0}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderCollapse: 'collapse',
                      }}
                    >
                      <tbody>
                        <tr>
                          <td valign="top" style={{ height: '100%', ...COLUMN_WORD_WRAP }}>
                            {col}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                );
              }

              return (
                <td
                  key={index}
                  width={columnWidth}
                  valign={valign}
                  style={tdStyle}
                >
                  {col}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
