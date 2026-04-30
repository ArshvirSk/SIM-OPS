/**
 * Slack API Type Definitions
 * Explicit types for Slack API requests and responses
 */

export type SlackBlock =
  | SlackHeaderBlock
  | SlackSectionBlock
  | SlackContextBlock
  | SlackDividerBlock
  | SlackActionsBlock;

export interface SlackHeaderBlock {
  type: "header";
  text: {
    type: "plain_text";
    text: string;
    emoji?: boolean;
  };
  block_id?: string;
}

export interface SlackSectionBlock {
  type: "section";
  text?: {
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
  };
  fields?: Array<{
    type: "plain_text" | "mrkdwn";
    text: string;
    emoji?: boolean;
    verbatim?: boolean;
  }>;
  accessory?: SlackBlockElement;
  block_id?: string;
}

export interface SlackContextBlock {
  type: "context";
  elements: Array<{
    type: "plain_text" | "mrkdwn" | "image";
    text?: string;
    image_url?: string;
    alt_text?: string;
    emoji?: boolean;
  }>;
  block_id?: string;
}

export interface SlackDividerBlock {
  type: "divider";
  block_id?: string;
}

export interface SlackActionsBlock {
  type: "actions";
  elements: SlackBlockElement[];
  block_id?: string;
}

export type SlackBlockElement =
  | SlackButtonElement
  | SlackSelectElement
  | SlackOverflowElement;

export interface SlackButtonElement {
  type: "button";
  text: {
    type: "plain_text";
    text: string;
    emoji?: boolean;
  };
  action_id: string;
  url?: string;
  value?: string;
  style?: "primary" | "danger";
}

export interface SlackSelectElement {
  type:
    | "static_select"
    | "external_select"
    | "users_select"
    | "conversations_select"
    | "channels_select";
  action_id: string;
  placeholder?: {
    type: "plain_text";
    text: string;
    emoji?: boolean;
  };
}

export interface SlackOverflowElement {
  type: "overflow";
  action_id: string;
  options: Array<{
    text: {
      type: "plain_text";
      text: string;
      emoji?: boolean;
    };
    value: string;
  }>;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  image_url?: string;
  thumb_url?: string;
}

export interface SlackMessageRequest {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  thread_ts?: string;
  mrkdwn?: boolean;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
}

export interface SlackMessageResponse {
  ok: boolean;
  ts: string;
  channel: string;
  message?: {
    type: string;
    subtype?: string;
    text: string;
    ts: string;
    username?: string;
    bot_id?: string;
  };
  error?: string;
  warning?: string;
  [key: string]: unknown;
}

export interface SlackWebhookRequest {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  channel?: string;
}

export interface SlackError {
  ok: false;
  error: string;
  warning?: string;
}

// Type guard for Slack errors
export function isSlackError(value: unknown): value is SlackError {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as SlackError).ok === false &&
    "error" in value &&
    typeof (value as SlackError).error === "string"
  );
}

// Helper to create header block
export function createHeaderBlock(text: string): SlackHeaderBlock {
  return {
    type: "header",
    text: {
      type: "plain_text",
      text,
    },
  };
}

// Helper to create section block
export function createSectionBlock(
  text: string,
  markdown = true,
): SlackSectionBlock {
  return {
    type: "section",
    text: {
      type: markdown ? "mrkdwn" : "plain_text",
      text,
    },
  };
}

// Helper to create context block
export function createContextBlock(text: string): SlackContextBlock {
  return {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text,
      },
    ],
  };
}

// Helper to create divider block
export function createDividerBlock(): SlackDividerBlock {
  return {
    type: "divider",
  };
}
