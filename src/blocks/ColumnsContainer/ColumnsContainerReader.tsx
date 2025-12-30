import React from 'react';

import { ColumnsContainer as BaseColumnsContainer } from '@usewaypoint/block-columns-container';

import { ReaderBlock } from '../../Reader/core';

import { ColumnsContainerProps } from './ColumnsContainerPropsSchema';

export default function ColumnsContainerReader({ style, props }: ColumnsContainerProps) {
  const { columns, columnsCount, ...restProps } = props ?? {};
  const count = columnsCount ?? (columns?.length ?? 3);

  let cols = undefined;
  if (columns) {
    cols = columns.map((col) => col.childrenIds.map((childId) => <ReaderBlock key={childId} id={childId} />));
  }

  // BaseColumnsContainer 只支持 2 或 3 列，对于 1 或 4 列，我们需要自定义渲染
  if (count === 1 || count === 4) {
    const columnsGap = (restProps && 'columnsGap' in restProps) ? restProps.columnsGap ?? 0 : 0;
    const contentAlignment = (restProps && 'contentAlignment' in restProps) ? restProps.contentAlignment ?? 'middle' : 'middle';
    const fixedWidths = (restProps && 'fixedWidths' in restProps) ? restProps.fixedWidths : undefined;

    // 计算列宽
    const getColumnWidth = (index: number): string => {
      if (fixedWidths && fixedWidths[index] !== null && fixedWidths[index] !== undefined) {
        return `${fixedWidths[index]}%`;
      }
      return count === 1 ? '100%' : '25%';
    };

    // 对于HTML邮件，使用table布局
    const paddingStyle = style?.padding
      ? {
        paddingTop: `${style.padding.top}px`,
        paddingRight: `${style.padding.right}px`,
        paddingBottom: `${style.padding.bottom}px`,
        paddingLeft: `${style.padding.left}px`,
      }
      : {};

    const backgroundColorStyle = style?.backgroundColor
      ? { backgroundColor: style.backgroundColor }
      : {};

    return (
      <table
        role="presentation"
        cellSpacing="0"
        cellPadding="0"
        border={0}
        width="100%"
        style={{
          width: '100%',
          tableLayout: 'fixed',
          ...paddingStyle,
          ...backgroundColorStyle,
        }}
      >
        <tbody>
          <tr>
            {cols?.map((col, index) => (
              <td
                key={index}
                width={getColumnWidth(index)}
                style={{
                  width: getColumnWidth(index),
                  verticalAlign: contentAlignment === 'top' ? 'top' : contentAlignment === 'bottom' ? 'bottom' : 'middle',
                  paddingLeft: index > 0 ? `${columnsGap / 2}px` : '0',
                  paddingRight: index < (count - 1) ? `${columnsGap / 2}px` : '0',
                }}
              >
                {col}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }

  // 对于 2 或 3 列，使用 BaseColumnsContainer
  // 需要过滤掉 fixedWidths 的第4个元素（如果存在）
  let baseFixedWidths: [number | null | undefined, number | null | undefined, number | null | undefined] | undefined = undefined;

  if (restProps && 'fixedWidths' in restProps && restProps.fixedWidths) {
    baseFixedWidths = [restProps.fixedWidths[0], restProps.fixedWidths[1], restProps.fixedWidths[2]];
  }

  // 创建不包含 fixedWidths 的 baseProps
  const baseProps: any = {
    ...(restProps && typeof restProps === 'object' ? restProps : {}),
    columnsCount: count as 2 | 3,
  };

  // 如果有 fixedWidths，只取前3个元素
  if (baseFixedWidths !== undefined) {
    baseProps.fixedWidths = baseFixedWidths;
  } else if (restProps && 'fixedWidths' in restProps) {
    // 如果原 fixedWidths 是 null 或 undefined，也传递 null
    baseProps.fixedWidths = null;
  }

  return <BaseColumnsContainer props={baseProps} columns={cols} style={style} />;
}
