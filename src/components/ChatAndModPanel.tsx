import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Pin,
  EyeOff,
  Eye,
  Clock,
  Volume2,
  Flame,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { ChatComment, CommentType } from '../lib/streamEngine';
import { Badge, Button, Input, Textarea } from './ui/primitives';

interface ChatAndModPanelProps {
  comments: ChatComment[];
  timedOutUsers: string[];
  onAddComments: (rawText: string, username: string, explicitType?: CommentType) => void;
  onReadOutLoud: (comment: ChatComment) => void;
  onRoastComment: (comment: ChatComment) => void;
  onTogglePin: (commentId: string) => void;
  onToggleHide: (commentId: string) => void;
  onTimeoutUser: (username: string) => void;
  onRestoreUser: (username: string) => void;
}

export const ChatAndModPanel: React.FC<ChatAndModPanelProps> = ({
  comments,
  timedOutUsers,
  onAddComments,
  onReadOutLoud,
  onRoastComment,
  onTogglePin,
  onToggleHide,
  onTimeoutUser,
  onRestoreUser,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedType, setSelectedType] = useState<CommentType | 'auto'>('auto');
  const [showHidden, setShowHidden] = useState(false);
  const [validationNotice, setValidationNotice] = useState<string | null>(null);

  const pinnedComment = comments.find((c) => c.pinned && !c.hidden) ?? null;
  const visibleComments = comments.filter((c) => (showHidden ? true : !c.hidden));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) {
      setValidationNotice('Drop a real viewer comment, follower name, or gift alert first.');
      return;
    }
    setValidationNotice(null);
    onAddComments(
      messageInput,
      usernameInput || 'chat_viewer',
      selectedType === 'auto' ? undefined : selectedType
    );
    setMessageInput('');
  };

  return (
    <section
      aria-label="Live Viewer Chat and One-Tap Mod Tools"
      className="surface-card p-4 sm:p-5 space-y-4 overflow-hidden"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="type-title text-[#F5F3FF]">Live Chat & One-Tap Mod Deck</h2>
          </div>
          <p className="type-caption text-[#B6B0CC] font-normal mt-0.5">
            Paste real stream comments, followers, or hecklers for instant Beatshredder reactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold" className="font-mono-tabular">
            {comments.filter((c) => !c.hidden).length} Active
          </Badge>
          {comments.some((c) => c.hidden) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHidden((prev) => !prev)}
            >
              {showHidden ? 'Hide Moderated' : 'Show Hidden'}
            </Button>
          )}
        </div>
      </div>

      {/* Pinned Comment Spotlight */}
      {pinnedComment && (
        <div
          data-testid="pinned-comment-banner"
          className="surface-inset border-[#F59E0B]/60 p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 overflow-hidden"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 type-caption text-[#F59E0B]">
              <Pin className="w-4 h-4" />
              <span className="truncate">
                Pinned Stage Comment / @{pinnedComment.username}
              </span>
            </div>
            <p className="type-body text-[#F5F3FF] break-words [overflow-wrap:anywhere]">
              {pinnedComment.text}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onTogglePin(pinnedComment.id)}
            aria-label={`Unpin comment from ${pinnedComment.username}`}
            className="shrink-0"
          >
            Unpin
          </Button>
        </div>
      )}

      {/* Streamer Comment / Follower Paste Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2.5">
          <div>
            <label htmlFor="chat-username-input" className="sr-only">
              Viewer Username
            </label>
            <Input
              id="chat-username-input"
              type="text"
              placeholder="@username (optional — or paste @user: message below)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
          </div>

          <div
            role="group"
            aria-label="Comment Event Type"
            className="grid grid-cols-2 sm:grid-cols-5 gap-2"
          >
            {(
              [
                { id: 'auto', label: 'Auto-Detect' },
                { id: 'comment', label: 'Comment' },
                { id: 'follower', label: 'New Follower' },
                { id: 'gift', label: 'Gift Train' },
                { id: 'heckle', label: 'Heckler' },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                active={selectedType === item.id}
                onClick={() => setSelectedType(item.id)}
                className="w-full"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <label htmlFor="chat-message-input" className="sr-only">
            Viewer Comment or Pasted Chat Lines
          </label>
          <Textarea
            id="chat-message-input"
            rows={2}
            placeholder="Paste or type viewer chat (e.g. @dj_nova: Drop that 808!)..."
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              if (validationNotice) setValidationNotice(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-1"
          />
          <Button type="submit" variant="gold" className="sm:w-auto w-full shrink-0">
            <MessageSquarePlus className="w-4 h-4" />
            <span>Send to Cohost</span>
          </Button>
        </div>

        {validationNotice && (
          <p role="alert" className="type-caption text-[#F59E0B]">
            {validationNotice}
          </p>
        )}
      </form>

      {/* Timed-Out Users Strip */}
      {timedOutUsers.length > 0 && (
        <div
          data-testid="timed-out-users"
          className="flex flex-wrap items-center gap-2 pt-1 type-caption text-[#B6B0CC]"
        >
          <span>Timed out users:</span>
          {timedOutUsers.map((u) => (
            <Button
              key={u}
              type="button"
              variant="outline"
              onClick={() => onRestoreUser(u)}
              aria-label={`Remove timeout for ${u}`}
              className="max-w-full"
            >
              <span className="truncate max-w-[160px]">@{u}</span>
              <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
            </Button>
          ))}
        </div>
      )}

      {/* Live Comments Feed — Resilient to long usernames, long messages & comment floods */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {visibleComments.length === 0 ? (
          <div className="surface-inset p-5 text-center space-y-1.5">
            <p className="type-title text-[#F5F3FF]">Chat Deck Ready for Your Room</p>
            <p className="type-caption text-[#B6B0CC] font-normal">
              Zero fake viewers or bots. Paste live viewer comments above or let Beatshredder run the stage solo.
            </p>
          </div>
        ) : (
          visibleComments.map((item) => (
            <div
              key={item.id}
              data-testid="chat-comment-row"
              className={`rounded-xl p-3.5 border space-y-2.5 overflow-hidden ${
                item.hidden
                  ? 'bg-[#0D0B14]/50 border-white/5 opacity-60'
                  : item.pinned
                    ? 'bg-[#191426] border-[#F59E0B]/60'
                    : 'bg-[#0D0B14] border-white/10'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 type-caption text-[#B6B0CC] min-w-0">
                  <strong className="text-[#F59E0B] font-bold break-all max-w-full">
                    @{item.username}
                  </strong>
                  <span aria-hidden="true">/</span>
                  <span className="uppercase">{item.type}</span>
                  {item.pinned && (
                    <Badge tone="gold" className="py-0.5 px-2">
                      Pinned
                    </Badge>
                  )}
                  {item.hidden && (
                    <Badge tone="danger" className="py-0.5 px-2">
                      Hidden
                    </Badge>
                  )}
                </div>

                <p className="type-body text-[#F5F3FF] break-words [overflow-wrap:anywhere]">
                  {item.text}
                </p>

                {item.roastReply && (
                  <p className="type-caption text-[#FBBF24] pt-1 break-words [overflow-wrap:anywhere]">
                    Beatshredder Roast: “{item.roastReply}”
                  </p>
                )}
              </div>

              {/* One-Tap Cohost & Mod Actions — 48px touch targets */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onReadOutLoud(item)}
                  aria-label={`Read out loud comment from ${item.username}`}
                >
                  <Volume2 className="w-4 h-4 text-[#F59E0B]" />
                  <span>Read Loud</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRoastComment(item)}
                  aria-label={`Lightly roast ${item.username}`}
                >
                  <Flame className="w-4 h-4 text-[#F59E0B]" />
                  <span>Light Roast</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  active={item.pinned}
                  onClick={() => onTogglePin(item.id)}
                  aria-label={
                    item.pinned
                      ? `Unpin comment from ${item.username}`
                      : `Pin comment from ${item.username}`
                  }
                >
                  <Pin className="w-4 h-4" />
                  <span>{item.pinned ? 'Pinned' : 'Pin'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onToggleHide(item.id)}
                  aria-label={
                    item.hidden
                      ? `Unhide comment from ${item.username}`
                      : `Hide comment from ${item.username}`
                  }
                >
                  {item.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{item.hidden ? 'Unhide' : 'Hide'}</span>
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => onTimeoutUser(item.username)}
                  aria-label={`Time out user ${item.username}`}
                  className="col-span-2 sm:col-span-1"
                >
                  <Clock className="w-4 h-4" />
                  <span>Timeout</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
