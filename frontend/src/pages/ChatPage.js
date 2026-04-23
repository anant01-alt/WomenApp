import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { chatAPI, userAPI } from '../services/api';
import { getSocket, joinRoom, leaveRoom, sendTyping } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import styles from './ChatPage.module.css';

const normalizePhone = (value = '') => value.replace(/[^\d]/g, '');

const buildDirectRoomId = (currentUser, contact) => {
  const participants = [
    normalizePhone(currentUser?.phone) || `user-${currentUser?._id || 'self'}`,
    normalizePhone(contact?.phone) || `contact-${contact?._id || 'unknown'}`,
  ].sort();

  return `direct:${participants.join('__')}`;
};

const getContactInitial = (name = '') => name.trim().charAt(0).toUpperCase() || '?';

export default function ChatPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobileRoomOpen, setIsMobileRoomOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const socketRef = useRef(getSocket());
  const activeRoomRef = useRef(null);

  const contactsWithRooms = useMemo(
    () =>
      contacts.map((contact) => ({
        ...contact,
        roomId: buildDirectRoomId(user, contact),
      })),
    [contacts, user]
  );

  useEffect(() => {
    socketRef.current = getSocket();
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadContacts = async () => {
      try {
        const { data } = await userAPI.getContacts();
        if (isMounted) {
          setContacts(data.contacts || []);
        }
      } catch {
        if (isMounted) {
          toast.error('Unable to load contacts right now.');
        }
      } finally {
        if (isMounted) {
          setLoadingContacts(false);
        }
      }
    };

    loadContacts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user?._id) return undefined;

    const handleNewMessage = (msg) => {
      if (!activeRoomRef.current || msg.room !== activeRoomRef.current.id) return;

      setMessages((prev) => {
        const optimisticIndex = prev.findIndex(
          (item) =>
            item.optimistic &&
            item.content === msg.content &&
            (item.sender?._id === msg.sender?._id || item.sender === msg.sender?._id)
        );

        if (optimisticIndex !== -1) {
          const next = [...prev];
          next[optimisticIndex] = msg;
          return next;
        }

        if (prev.some((item) => item._id === msg._id)) {
          return prev;
        }

        return [...prev, msg];
      });
    };

    const handleUserTyping = (data) => {
      if (!activeRoomRef.current || data.room !== activeRoomRef.current.id) return;
      if (data.userId === user._id) return;
      setTypingUser(data.isTyping ? data.name : null);
    };

    const handleMessageError = () => {
      setMessages((prev) => prev.filter((item) => !item.optimistic));
      toast.error('Message could not be delivered.');
      setSending(false);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_error', handleMessageError);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_error', handleMessageError);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typingUser]);

  useEffect(() => {
    return () => {
      if (activeRoomRef.current) {
        leaveRoom(activeRoomRef.current.id);
      }
      clearTimeout(typingTimerRef.current);
    };
  }, []);

  const openRoom = async (contact) => {
    const room = { id: contact.roomId, contact };

    if (activeRoomRef.current?.id && activeRoomRef.current.id !== room.id) {
      leaveRoom(activeRoomRef.current.id);
    }

    setActiveRoom(room);
    activeRoomRef.current = room;
    setMessages([]);
    setTypingUser(null);
    setIsMobileRoomOpen(true);
    setLoadingMessages(true);
    joinRoom(room.id);

    try {
      const { data } = await chatAPI.getMessages(room.id);
      setMessages(data.messages || []);
    } catch {
      toast.error('Unable to load this chat.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const closeMobileRoom = () => {
    setIsMobileRoomOpen(false);
    setTypingUser(null);
  };

  const handleSend = async (e) => {
    e?.preventDefault();

    if (!input.trim() || !activeRoom || sending) return;

    const content = input.trim();
    const tempId = `temp-${Date.now()}`;

    setInput('');
    setSending(true);
    sendTyping(activeRoom.id, false);
    clearTimeout(typingTimerRef.current);

    const tempMsg = {
      _id: tempId,
      sender: { _id: user._id, name: user.name },
      content,
      room: activeRoom.id,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('send_message', {
          room: activeRoom.id,
          content,
          receiverId: activeRoom.contact._id,
        });
      } else {
        await chatAPI.sendMessage(activeRoom.id, {
          content,
          receiverId: activeRoom.contact._id,
        });
      }
    } catch {
      setMessages((prev) => prev.filter((item) => item._id !== tempId));
      toast.error('Message could not be delivered.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    const nextValue = e.target.value;
    setInput(nextValue);

    if (!activeRoom) return;

    sendTyping(activeRoom.id, true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(activeRoom.id, false), 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  const isMine = (msg) => msg.sender?._id === user._id || msg.sender === user._id;
  const showContactList = !isMobileRoomOpen;
  const showChatWindow = !activeRoom || isMobileRoomOpen;

  return (
    <div className={`fade-in ${styles.page}`}>
      <div className={styles.chatLayout}>
        <aside
          className={`${styles.contactsSidebar} ${showContactList ? styles.sidebarVisible : styles.sidebarHidden}`}
          aria-label="Chat contacts"
        >
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Messages</h2>
            <p className={styles.sidebarSubtitle}>Emergency communication</p>
          </div>

          {loadingContacts ? (
            <div className={styles.stateCard}>Loading contacts...</div>
          ) : contactsWithRooms.length === 0 ? (
            <div className={styles.noContacts}>
              <div className={styles.stateIcon}>Chat</div>
              <p>No contacts yet. Add emergency contacts to start chatting.</p>
            </div>
          ) : (
            <div className={styles.contactsListChat}>
              {contactsWithRooms.map((contact) => {
                const isActive = activeRoom?.id === contact.roomId;

                return (
                  <button
                    key={contact._id}
                    type="button"
                    className={`${styles.contactRow} ${isActive ? styles.activeContact : ''}`}
                    onClick={() => openRoom(contact)}
                  >
                    <div className={styles.contactAvatarChat}>{getContactInitial(contact.name)}</div>
                    <div className={styles.contactMeta}>
                      <div className={styles.contactName}>{contact.name}</div>
                      <div className={styles.contactDetails}>
                        {contact.relationship} / {contact.phone}
                      </div>
                    </div>
                    {contact.isPrimary ? (
                      <span className={styles.primaryMarker} aria-label="Primary contact">
                        STAR
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section
          className={`${styles.chatWindow} ${showChatWindow ? styles.chatVisible : styles.chatHidden}`}
          aria-label="Chat room"
        >
          {!activeRoom ? (
            <div className={styles.noChatSelected}>
              <div className={styles.emptyIcon}>Chat</div>
              <h3 className={styles.emptyTitle}>Select a contact</h3>
              <p className={styles.emptyCopy}>Choose a trusted contact to start an emergency chat.</p>
            </div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <button type="button" className={styles.backButton} onClick={closeMobileRoom}>
                  Back
                </button>
                <div className={styles.contactAvatarChat}>{getContactInitial(activeRoom.contact.name)}</div>
                <div className={styles.headerMeta}>
                  <div className={styles.headerName}>{activeRoom.contact.name}</div>
                  <div className={styles.headerSubtext}>
                    <span className="pulse-dot" style={{ background: 'var(--success)', width: 6, height: 6 }} />
                    {activeRoom.contact.phone}
                  </div>
                </div>
                <div className={styles.headerBadgeWrap}>
                  <span className="badge badge-pink">Emergency Contact</span>
                </div>
              </div>

              <div className={styles.messages}>
                {loadingMessages ? (
                  <div className={styles.stateCard}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className={styles.stateCard}>No messages yet. Say hello or send an emergency message.</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`${styles.messageRow} ${isMine(msg) ? styles.mine : styles.theirs}`}
                    >
                      {!isMine(msg) ? (
                        <div className={styles.msgAvatar}>{getContactInitial(activeRoom.contact.name)}</div>
                      ) : null}
                      <div className={`${styles.bubble} ${isMine(msg) ? styles.bubbleMine : styles.bubbleTheirs}`}>
                        <div className={styles.messageText}>{msg.content}</div>
                        <div className={styles.msgTime}>
                          {msg.optimistic
                            ? 'Sending...'
                            : formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {typingUser ? (
                  <div className={styles.typingIndicator}>
                    <div className={styles.typingDots}>
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className={styles.typingText}>{typingUser} is typing...</span>
                  </div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              <form className={styles.inputArea} onSubmit={handleSend}>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="sentences"
                  spellCheck="true"
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  className={styles.messageInput}
                />
                <button
                  type="submit"
                  className={`btn-primary ${styles.sendButton}`}
                  disabled={!input.trim() || sending}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
