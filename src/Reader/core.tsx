import React, { createContext, useContext } from 'react';
import { z } from 'zod';

import { Button, ButtonPropsSchema } from 'monto-email-block-button';
import { Divider, DividerPropsSchema } from 'monto-email-block-divider';
import { Heading, HeadingPropsSchema } from 'monto-email-block-heading';
import { Html, HtmlPropsSchema } from 'monto-email-block-html';
import { Image, ImagePropsSchema } from 'monto-email-block-image';
import { Spacer, SpacerPropsSchema } from 'monto-email-block-spacer';
import { Text, TextPropsSchema } from 'monto-email-block-text';
import { Video, VideoPropsSchema } from 'monto-email-block-video';
import { Socials, SocialsPropsSchema } from 'monto-email-block-socials';
import {
  buildBlockComponent,
  buildBlockConfigurationDictionary,
  buildBlockConfigurationSchema,
} from 'monto-email-document-core';

import ColumnsContainerPropsSchema from '../blocks/ColumnsContainer/ColumnsContainerPropsSchema';
import ColumnsContainerReader from '../blocks/ColumnsContainer/ColumnsContainerReader';
import { ContainerPropsSchema } from '../blocks/Container/ContainerPropsSchema';
import ContainerReader from '../blocks/Container/ContainerReader';
import { EmailLayoutPropsSchema } from '../blocks/EmailLayout/EmailLayoutPropsSchema';
import EmailLayoutReader from '../blocks/EmailLayout/EmailLayoutReader';

// 包装 Video 组件以确保始终返回 Element 而不是 null
function VideoWrapper(props: Parameters<typeof Video>[0]): React.ReactElement {
  const result = Video(props);
  return result ?? <div />;
}

const ReaderContext = createContext<TReaderDocument>({});

export function useReaderDocument() {
  return useContext(ReaderContext);
}

const READER_DICTIONARY = buildBlockConfigurationDictionary({
  ColumnsContainer: {
    schema: ColumnsContainerPropsSchema,
    Component: ColumnsContainerReader,
  },
  Container: {
    schema: ContainerPropsSchema,
    Component: ContainerReader,
  },
  EmailLayout: {
    schema: EmailLayoutPropsSchema,
    Component: EmailLayoutReader,
  },
  Button: {
    schema: ButtonPropsSchema,
    Component: Button,
  },
  Divider: {
    schema: DividerPropsSchema,
    Component: Divider,
  },
  Heading: {
    schema: HeadingPropsSchema,
    Component: Heading,
  },
  Html: {
    schema: HtmlPropsSchema,
    Component: Html,
  },
  Image: {
    schema: ImagePropsSchema,
    Component: Image,
  },
  Spacer: {
    schema: SpacerPropsSchema,
    Component: Spacer,
  },
  Text: {
    schema: TextPropsSchema,
    Component: Text,
  },
  Video: {
    schema: VideoPropsSchema,
    Component: VideoWrapper,
  },
  Socials: {
    schema: SocialsPropsSchema,
    Component: Socials,
  },
});

export const ReaderBlockSchema = buildBlockConfigurationSchema(READER_DICTIONARY);
export type TReaderBlock = z.infer<typeof ReaderBlockSchema>;

export const ReaderDocumentSchema = z.record(z.string(), ReaderBlockSchema);
export type TReaderDocument = Record<string, TReaderBlock>;

const BaseReaderBlock = buildBlockComponent(READER_DICTIONARY);

export type TReaderBlockProps = { id: string; document?: TReaderDocument };
export function ReaderBlock({ id, document: documentProp }: TReaderBlockProps) {
  // 如果提供了 document prop，直接使用（SSR 渲染时）
  if (documentProp) {
    const block = documentProp[id];
    if (!block) {
      return null;
    }
    return <BaseReaderBlock {...block} />;
  }

  // 否则从 Context 获取（客户端渲染时）
  // 使用 Consumer 而不是 Hook，以避免 SSR 问题
  return (
    <ReaderContext.Consumer>
      {(document) => {
        const block = document[id];
        if (!block) {
          return null;
        }
        return <BaseReaderBlock {...block} />;
      }}
    </ReaderContext.Consumer>
  );
}

export type TReaderProps = {
  document: Record<string, z.infer<typeof ReaderBlockSchema>>;
  rootBlockId: string;
};
const STRETCH_BLOCK_WRAPPER_STYLE = `[data-stretch-block-wrapper] > * { height: 100%; min-height: 0; box-sizing: border-box; }`;

export default function Reader({ document, rootBlockId }: TReaderProps) {
  return (
    <ReaderContext.Provider value={document}>
      <style>{STRETCH_BLOCK_WRAPPER_STYLE}</style>
      <ReaderBlock id={rootBlockId} document={document} />
    </ReaderContext.Provider>
  );
}
